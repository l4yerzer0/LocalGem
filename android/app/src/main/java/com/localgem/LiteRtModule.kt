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
                    visionBackend = Backend.GPU(), // Обязательно для обработки картинок!
                    maxNumTokens = maxTokens
                )
                engine?.close()
                engine = Engine(config)
                engine?.initialize()
                
                // Для Gemma4/Gemma2IT важно указать поддержку каналов если нужно
                val convConfig = ConversationConfig(
                    samplerConfig = SamplerConfig(topK = topK, topP = topP, temperature = temperature)
                )
                conversation = engine?.createConversation(convConfig)
                promise.resolve("LocalGem: Ready")
            } catch (e: Exception) {
                promise.reject("INIT_ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun sendMessage(text: String, imagePath: String?, isThinkingEnabled: Boolean) {
        val conv = conversation ?: return
        scope.launch {
            try {
                val contentsList = mutableListOf<Content>()
                
                // Читаем картинку напрямую из файла
                imagePath?.let {
                    val file = File(it)
                    if (file.exists()) {
                        contentsList.add(Content.ImageBytes(file.readBytes()))
                    }
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
                        
                        // Пытаемся получить мысли из ВСЕХ возможных каналов (иногда они называются иначе)
                        val thought = message.channels["thought"] ?: message.channels["thinking"] ?: message.channels["reasoning"]
                        if (thought != null && thought.isNotEmpty()) {
                            sendEvent("onThinkingReceived", thought)
                        }
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
                    imagePickerPromise?.reject("ERROR", "Failed to decode image from gallery")
                    return@launch
                }
                
                // МАСШТАБИРОВАНИЕ: Уменьшаем до 768x768 для стабильности на слабых устройствах (Note 9)
                val maxDim = 768
                val scale = Math.min(maxDim.toFloat() / originalBitmap.width, maxDim.toFloat() / originalBitmap.height)
                
                val finalBitmap = if (scale < 1.0) {
                    Bitmap.createScaledBitmap(originalBitmap, (originalBitmap.width * scale).toInt(), (originalBitmap.height * scale).toInt(), true)
                } else {
                    originalBitmap
                }

                val outputStream = ByteArrayOutputStream()
                finalBitmap.compress(Bitmap.CompressFormat.PNG, 90, outputStream)
                
                // Сохраняем в кэш-файл
                val cacheDir = reactApplicationContext.cacheDir
                val tempFile = File(cacheDir, "temp_img_${System.currentTimeMillis()}.png")
                FileOutputStream(tempFile).use { it.write(outputStream.toByteArray()) }

                val map = Arguments.createMap().apply {
                    putString("uri", "file://${tempFile.absolutePath}")
                    putString("filePath", tempFile.absolutePath)
                }
                imagePickerPromise?.resolve(map)
            } catch (e: Exception) { 
                imagePickerPromise?.reject("ERROR", e.message) 
            } finally { 
                imagePickerPromise = null 
            }
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
