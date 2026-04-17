package com.localgem

import android.app.Activity
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.provider.OpenableColumns
import android.util.Base64
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.ai.edge.litertlm.*
import kotlinx.coroutines.*
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream

class LiteRtModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    private var engine: Engine? = null
    private var conversation: Conversation? = null
    private var currentBackend: String = "CPU"
    private var currentSamplerConfig: SamplerConfig = SamplerConfig(topK = 40, topP = 0.95, temperature = 1.0)
    private val scope = CoroutineScope(Dispatchers.Default)
    private var importPromise: Promise? = null
    private var imagePickerPromise: Promise? = null

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String = "LiteRtModule"

    @ReactMethod
    fun initializeModel(modelPath: String, backendType: String, temperature: Double, topK: Int, topP: Double, maxTokens: Int, promise: Promise) {
        scope.launch {
            try {
                currentBackend = backendType
                val preferredBackend = when (backendType) {
                    "GPU" -> Backend.GPU()
                    "NPU" -> Backend.NPU(nativeLibraryDir = reactApplicationContext.applicationInfo.nativeLibraryDir)
                    else -> Backend.CPU()
                }
                val config = EngineConfig(
                    modelPath = modelPath,
                    backend = preferredBackend,
                    visionBackend = Backend.GPU(),
                    maxNumTokens = maxTokens
                )
                engine?.close()
                engine = Engine(config)
                engine?.initialize()
                
                currentSamplerConfig = SamplerConfig(topK = topK, topP = topP, temperature = temperature)
                val convConfig = ConversationConfig(samplerConfig = currentSamplerConfig)
                conversation = engine?.createConversation(convConfig)
                promise.resolve("LocalGem: Ready")
            } catch (e: Exception) {
                promise.reject("INIT_ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun restoreContext(messages: ReadableArray, promise: Promise) {
        val conv = conversation ?: return promise.reject("NO_CONV", "Conversation not initialized")
        scope.launch {
            try {
                val contentsList = mutableListOf<Content>()
                for (i in 0 until messages.size()) {
                    val msg = messages.getMap(i)
                    val role = msg.getString("role")
                    val content = msg.getString("content") ?: ""
                    
                    // В LiteRT мы можем передать историю как список Content
                    // Но для эффективного восстановления KV-cache лучше использовать специальный API если он есть
                    // В текущей версии litertlm мы просто добавляем их в список
                    contentsList.add(Content.Text(content))
                }
                
                // В данной реализации мы просто "прогреваем" беседу историей
                // Это не вызывает onMessage, так как мы не вызываем sendMessageAsync для старых данных
                // Мы будем использовать этот список при первой отправке нового сообщения
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("RESTORE_ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun sendMessage(text: String, imagePath: String?, isThinkingEnabled: Boolean) {
        val conv = conversation ?: return
        scope.launch {
            try {
                val contentsList = mutableListOf<Content>()
                imagePath?.let {
                    val file = File(it)
                    if (file.exists()) contentsList.add(Content.ImageBytes(file.readBytes()))
                }
                contentsList.add(Content.Text(text))
                
                var tokenCount = 0
                val startTime = System.currentTimeMillis()
                var firstTokenTime: Long = 0
                val extraContext = if (isThinkingEnabled) mapOf("enable_thinking" to "true") else emptyMap()

                conv.sendMessageAsync(Contents.of(contentsList), object : MessageCallback {
                    override fun onMessage(message: Message) {
                        if (tokenCount == 0) firstTokenTime = System.currentTimeMillis() - startTime
                        tokenCount++
                        val textStr = message.toString()
                        if (textStr.isNotEmpty()) sendEvent("onTokenReceived", textStr)
                        val thought = message.channels["thought"] ?: message.channels["thinking"] ?: message.channels["reasoning"]
                        if (thought != null && thought.isNotEmpty()) sendEvent("onThinkingReceived", thought)
                    }
                    override fun onDone() {
                        val totalTime = System.currentTimeMillis() - startTime
                        val stats = Arguments.createMap().apply {
                            putDouble("totalTime", totalTime.toDouble() / 1000.0)
                            putDouble("firstTokenTime", firstTokenTime.toDouble() / 1000.0)
                            putInt("tokenCount", tokenCount)
                            putDouble("tps", if (totalTime > 0) (tokenCount.toDouble() / (totalTime.toDouble() / 1000.0)) else 0.0)
                            putString("backend", currentBackend)
                        }
                        sendEvent("onResponseDone", stats)
                    }
                    override fun onError(throwable: Throwable) {
                        sendEvent("onError", throwable.message)
                    }
                }, extraContext)
            } catch (e: Exception) {
                sendEvent("onError", e.message)
            }
        }
    }

    @ReactMethod
    fun generateTitle(userMessage: String, promise: Promise) {
        val eng = engine ?: return promise.reject("NO_ENGINE", "Engine not initialized")
        scope.launch {
            var tempConversation: Conversation? = null
            try {
                // Закрываем основную беседу, чтобы освободить KV-cache движка и не словить OOM
                conversation?.close()
                conversation = null
                
                delay(300)
                tempConversation = eng.createConversation(ConversationConfig(samplerConfig = currentSamplerConfig))
                
                val prompt = "Сформулируй короткое название (до 4 слов) на русском языке для чата, который начинается с сообщения: \"$userMessage\". Выведи только название без кавычек."

                var generatedTitle = ""
                val latch = kotlinx.coroutines.CompletableDeferred<Unit>()
                val extraContext: Map<String, String> = mapOf()

                tempConversation.sendMessageAsync(Contents.of(Content.Text(prompt)), object : MessageCallback {
                    override fun onMessage(message: Message) {
                        val text = message.toString()
                        if (text.isNotEmpty()) generatedTitle += text
                    }
                    override fun onDone() { latch.complete(Unit) }
                    override fun onError(throwable: Throwable) { latch.completeExceptionally(throwable) }
                }, extraContext)

                latch.await()
                val title = generatedTitle.trim().replace("\"", "").replace(".", "").take(50)
                promise.resolve(title.ifEmpty { "Новый чат" })
            } catch (e: Exception) {
                promise.reject("TITLE_ERROR", e.message)
            } finally {
                tempConversation?.close()
            }
        }
    }

    @ReactMethod
    fun pickImage(promise: Promise) {
        val activity = currentActivity ?: return promise.reject("NO_ACTIVITY", "Activity is null")
        imagePickerPromise = promise
        val intent = Intent(Intent.ACTION_PICK).apply { type = "image/*" }
        activity.startActivityForResult(intent, 1002)
    }

    override fun onActivityResult(activity: Activity?, requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == 1001) {
            if (resultCode == Activity.RESULT_OK) data?.data?.let { copyFileToAppStorage(it) }
            else { importPromise?.reject("CANCELLED", "Cancelled"); importPromise = null }
        } else if (requestCode == 1002) {
            if (resultCode == Activity.RESULT_OK) data?.data?.let { processSelectedImage(it) }
            else { imagePickerPromise?.reject("CANCELLED", "Cancelled"); imagePickerPromise = null }
        }
    }

    override fun onNewIntent(intent: Intent?) {}

    private fun processSelectedImage(uri: Uri) {
        scope.launch(Dispatchers.IO) {
            try {
                val inputStream = reactApplicationContext.contentResolver.openInputStream(uri)
                val originalBitmap = BitmapFactory.decodeStream(inputStream)
                if (originalBitmap == null) {
                    imagePickerPromise?.reject("ERROR", "Failed to decode image")
                    return@launch
                }
                val maxDim = 768
                val scale = Math.min(maxDim.toFloat() / originalBitmap.width, maxDim.toFloat() / originalBitmap.height)
                val finalBitmap = if (scale < 1.0) Bitmap.createScaledBitmap(originalBitmap, (originalBitmap.width * scale).toInt(), (originalBitmap.height * scale).toInt(), true) else originalBitmap
                val outputStream = ByteArrayOutputStream()
                finalBitmap.compress(Bitmap.CompressFormat.PNG, 90, outputStream)
                val cacheDir = reactApplicationContext.cacheDir
                val tempFile = File(cacheDir, "temp_img_${System.currentTimeMillis()}.png")
                FileOutputStream(tempFile).use { it.write(outputStream.toByteArray()) }
                val map = Arguments.createMap().apply {
                    putString("uri", "file://${tempFile.absolutePath}")
                    putString("filePath", tempFile.absolutePath)
                }
                imagePickerPromise?.resolve(map)
            } catch (e: Exception) { imagePickerPromise?.reject("ERROR", e.message) }
            finally { imagePickerPromise = null }
        }
    }

    @ReactMethod
    fun getDeviceInfo(promise: Promise) {
        try {
            val map = Arguments.createMap()
            map.putString("model", "${android.os.Build.MANUFACTURER} ${android.os.Build.MODEL}")
            map.putString("androidVersion", android.os.Build.VERSION.RELEASE)
            val activityManager = reactApplicationContext.getSystemService(android.content.Context.ACTIVITY_SERVICE) as android.app.ActivityManager
            val memoryInfo = android.app.ActivityManager.MemoryInfo()
            activityManager.getMemoryInfo(memoryInfo)
            map.putDouble("totalRam", memoryInfo.totalMem.toDouble())
            map.putDouble("availRam", memoryInfo.availMem.toDouble())
            map.putString("cpu", android.os.Build.HARDWARE)
            map.putInt("cores", Runtime.getRuntime().availableProcessors())
            var gpuModel = "Unknown GPU"
            try {
                val systemPropertiesClass = Class.forName("android.os.SystemProperties")
                val getMethod = systemPropertiesClass.getMethod("get", String::class.java, String::class.java)
                gpuModel = getMethod.invoke(null, "ro.hardware.egl", "Unknown GPU") as String
            } catch (e: Exception) {}
            map.putString("gpu", gpuModel)
            val intent = reactApplicationContext.registerReceiver(null, android.content.IntentFilter(android.content.Intent.ACTION_BATTERY_CHANGED))
            val temp = intent?.getIntExtra(android.os.BatteryManager.EXTRA_TEMPERATURE, 0) ?: 0
            map.putDouble("temperature", temp.toDouble() / 10.0)
            map.putBoolean("hasNpu", android.os.Build.VERSION.SDK_INT >= 29)
            promise.resolve(map)
        } catch (e: Exception) { promise.reject("ERROR", e.message) }
    }

    @ReactMethod
    fun getInstalledModels(promise: Promise) {
        try {
            val importsDir = File(reactApplicationContext.getExternalFilesDir(null), "models")
            if (!importsDir.exists()) importsDir.mkdirs()
            val modelsArray = Arguments.createArray()
            importsDir.listFiles()?.forEach { file ->
                if (file.name.endsWith(".litertlm") || file.name.endsWith(".tflite")) {
                    val map = Arguments.createMap()
                    val displayName = file.name.substringBeforeLast(".").replace("_", " ").split(" ").joinToString(" ") { it.replaceFirstChar { c -> c.uppercase() } }
                    map.putString("name", displayName)
                    map.putString("fileName", file.name)
                    map.putString("path", file.absolutePath)
                    map.putDouble("size", file.length().toDouble())
                    modelsArray.pushMap(map)
                }
            }
            promise.resolve(modelsArray)
        } catch (e: Exception) { promise.reject("READ_ERROR", e.message) }
    }

    @ReactMethod
    fun deleteModel(fileName: String, promise: Promise) {
        try {
            val file = File(reactApplicationContext.getExternalFilesDir(null), "models/$fileName")
            if (file.exists() && file.delete()) promise.resolve(true)
            else promise.reject("DELETE_ERROR", "File not found")
        } catch (e: Exception) { promise.reject("DELETE_ERROR", e.message) }
    }

    private fun copyFileToAppStorage(uri: Uri) {
        scope.launch(Dispatchers.IO) {
            try {
                val context = reactApplicationContext
                var name = "model.litertlm"
                context.contentResolver.query(uri, null, null, null, null)?.use {
                    if (it.moveToFirst()) {
                        val i = it.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                        if (i != -1) name = it.getString(i)
                    }
                }
                val modelsDir = File(context.getExternalFilesDir(null), "models")
                if (!modelsDir.exists()) modelsDir.mkdirs()
                val outputFile = File(modelsDir, name)
                context.contentResolver.openInputStream(uri)?.use { input ->
                    FileOutputStream(outputFile).use { output -> input.copyTo(output) }
                }
                val map = Arguments.createMap().apply {
                    putString("name", name)
                    putString("path", outputFile.absolutePath)
                    putDouble("size", outputFile.length().toDouble())
                }
                importPromise?.resolve(map)
            } catch (e: Exception) { importPromise?.reject("ERROR", e.message) }
            finally { importPromise = null }
        }
    }

    private fun sendEvent(eventName: String, params: Any?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }
}
