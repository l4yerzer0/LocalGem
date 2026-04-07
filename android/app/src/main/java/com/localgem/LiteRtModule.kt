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
    fun initializeModel(modelPath: String, promise: Promise) {
        scope.launch {
            try {
                val config = EngineConfig(
                    modelPath = modelPath,
                    backend = Backend.GPU() 
                )
                engine = Engine(config)
                engine?.initialize()
                
                conversation = engine?.createConversation(ConversationConfig())
                
                promise.resolve("LocalGem: Model ready!")
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

    // --- УПРАВЛЕНИЕ МОДЕЛЯМИ ---

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
            type = "*/*" // Разрешаем все типы, т.к. .litertlm не имеет стандартного MIME
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
                    map.putString("name", file.name)
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
                promise.reject("DELETE_ERROR", "File not found or cannot be deleted")
            }
        } catch (e: Exception) {
            promise.reject("DELETE_ERROR", e.message)
        }
    }

    // --- ОБРАБОТКА ВЫБОРА ФАЙЛА ---

    override fun onActivityResult(activity: Activity?, requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == 1001 && resultCode == Activity.RESULT_OK) {
            val uri = data?.data
            if (uri != null) {
                copyFileToAppStorage(uri)
            } else {
                importPromise?.reject("IMPORT_CANCELLED", "No file selected")
                importPromise = null
            }
        } else if (requestCode == 1001) {
            importPromise?.reject("IMPORT_CANCELLED", "Import cancelled")
            importPromise = null
        }
    }

    private fun copyFileToAppStorage(uri: Uri) {
        scope.launch(Dispatchers.IO) {
            try {
                val context = reactApplicationContext
                val cursor = context.contentResolver.query(uri, null, null, null, null)
                var name = "imported_model.litertlm"
                
                cursor?.use {
                    if (it.moveToFirst()) {
                        val nameIndex = it.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                        if (nameIndex != -1) name = it.getString(nameIndex)
                    }
                }

                val modelsDir = File(context.getExternalFilesDir(null), "models")
                if (!modelsDir.exists()) modelsDir.mkdirs()

                val outputFile = File(modelsDir, name)
                val inputStream = context.contentResolver.openInputStream(uri)
                val outputStream = FileOutputStream(outputFile)

                inputStream?.use { input ->
                    outputStream.use { output ->
                        input.copyTo(output)
                    }
                }
                
                // Возвращаем данные о загруженной модели
                val map = Arguments.createMap()
                map.putString("name", name)
                map.putString("path", outputFile.absolutePath)
                map.putDouble("size", outputFile.length().toDouble())
                
                importPromise?.resolve(map)
            } catch (e: Exception) {
                importPromise?.reject("COPY_ERROR", e.message)
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
