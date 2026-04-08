package com.localgem

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.provider.OpenableColumns
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.ai.edge.litertlm.*
import kotlinx.coroutines.*
import java.io.File
import java.io.FileOutputStream

class LiteRtModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    private var engine: Engine? = null
    private var conversation: Conversation? = null
    private val scope = CoroutineScope(Dispatchers.Default)
    private var importPromise: Promise? = null

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String = "LiteRtModule"

    @ReactMethod
    fun initializeModel(
        modelPath: String, 
        backendType: String,
        temperature: Double,
        topK: Int,
        topP: Double,
        maxTokens: Int,
        promise: Promise
    ) {
        scope.launch {
            try {
                val preferredBackend = when (backendType) {
                    "GPU" -> Backend.GPU()
                    "NPU" -> Backend.NPU(nativeLibraryDir = reactApplicationContext.applicationInfo.nativeLibraryDir)
                    else -> Backend.CPU()
                }

                val config = EngineConfig(
                    modelPath = modelPath,
                    backend = preferredBackend,
                    maxNumTokens = maxTokens
                )
                engine = Engine(config)
                engine?.initialize()
                
                val convConfig = ConversationConfig(
                    samplerConfig = SamplerConfig(
                        topK = topK,
                        topP = topP,
                        temperature = temperature
                    )
                )
                conversation = engine?.createConversation(convConfig)
                
                promise.resolve("LocalGem: Model ready with $backendType")
            } catch (e: Exception) {
                promise.reject("INIT_ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun sendMessage(text: String) {
        val conv = conversation ?: return
        
        scope.launch {
            try {
                val contents = Contents.of(listOf(Content.Text(text)))
                
                conv.sendMessageAsync(contents, object : MessageCallback {
                    override fun onMessage(message: Message) {
                        sendEvent("onTokenReceived", message.toString())
                    }
                    override fun onDone() {
                        sendEvent("onResponseDone", null)
                    }
                    override fun onError(throwable: Throwable) {
                        sendEvent("onError", throwable.message)
                    }
                })
            } catch (e: Exception) {
                sendEvent("onError", e.message)
            }
        }
    }

    @ReactMethod
    fun importModel(promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Activity is null")
            return
        }
        
        importPromise = promise
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "*/*"
        }
        activity.startActivityForResult(intent, 1001)
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
                    val displayName = file.name
                        .substringBeforeLast(".")
                        .replace("_", " ")
                        .replace("-", " ")
                        .split(" ")
                        .joinToString(" ") { it.replaceFirstChar { char -> char.uppercase() } }

                    map.putString("name", displayName)
                    map.putString("fileName", file.name)
                    map.putString("path", file.absolutePath)
                    map.putDouble("size", file.length().toDouble())
                    modelsArray.pushMap(map)
                }
            }
            promise.resolve(modelsArray)
        } catch (e: Exception) {
            promise.reject("READ_ERROR", e.message)
        }
    }

    @ReactMethod
    fun deleteModel(fileName: String, promise: Promise) {
        try {
            val file = File(reactApplicationContext.getExternalFilesDir(null), "models/$fileName")
            if (file.exists() && file.delete()) {
                promise.resolve(true)
            } else {
                promise.reject("DELETE_ERROR", "File not found")
            }
        } catch (e: Exception) {
            promise.reject("DELETE_ERROR", e.message)
        }
    }

    @ReactMethod
    fun getDeviceInfo(promise: Promise) {
        try {
            val map = Arguments.createMap()
            
            // 1. Модель и бренд
            map.putString("model", "${android.os.Build.MANUFACTURER} ${android.os.Build.MODEL}")
            map.putString("androidVersion", android.os.Build.VERSION.RELEASE)
            
            // 2. Оперативная память (RAM)
            val activityManager = reactApplicationContext.getSystemService(android.content.Context.ACTIVITY_SERVICE) as android.app.ActivityManager
            val memoryInfo = android.app.ActivityManager.MemoryInfo()
            activityManager.getMemoryInfo(memoryInfo)
            map.putDouble("totalRam", memoryInfo.totalMem.toDouble())
            map.putDouble("availRam", memoryInfo.availMem.toDouble())
            
            // 3. Процессор
            map.putString("cpu", android.os.Build.HARDWARE)
            map.putInt("cores", Runtime.getRuntime().availableProcessors())
            
            // 4. Температура (через Battery Intent)
            val intent = reactApplicationContext.registerReceiver(null, android.content.IntentFilter(android.content.Intent.ACTION_BATTERY_CHANGED))
            val temp = intent?.getIntExtra(android.os.BatteryManager.EXTRA_TEMPERATURE, 0) ?: 0
            map.putDouble("temperature", temp.toDouble() / 10.0) // Конвертируем в Цельсии
            
            // 5. Проверка поддержки ускорителей
            map.putBoolean("hasNpu", android.os.Build.HARDWARE.lowercase().contains("qcom") || 
                                    android.os.Build.HARDWARE.lowercase().contains("mt6") ||
                                    android.os.Build.HARDWARE.lowercase().contains("exynos") ||
                                    android.os.Build.HARDWARE.lowercase().contains("snapdragon"))
            
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("DEVICE_INFO_ERROR", e.message)
        }
    }

    override fun onActivityResult(activity: Activity?, requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == 1001 && resultCode == Activity.RESULT_OK) {
            val uri = data?.data
            if (uri != null) copyFileToAppStorage(uri)
            else importPromise?.reject("CANCELLED", "No file")
        } else if (requestCode == 1001) {
            importPromise?.reject("CANCELLED", "Cancelled")
        }
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
                val map = Arguments.createMap()
                map.putString("name", name)
                map.putString("path", outputFile.absolutePath)
                map.putDouble("size", outputFile.length().toDouble())
                importPromise?.resolve(map)
            } catch (e: Exception) {
                importPromise?.reject("ERROR", e.message)
            } finally {
                importPromise = null
            }
        }
    }

    override fun onNewIntent(intent: Intent?) {}

    private fun sendEvent(eventName: String, params: Any?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }
}
