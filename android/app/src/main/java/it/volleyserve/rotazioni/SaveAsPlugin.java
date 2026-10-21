package it.volleyserve.rotazioni;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * Native "Save as" for exports (see web/src/export/platformSave.ts): opens
 * the system file picker (Storage Access Framework, ACTION_CREATE_DOCUMENT)
 * so the user chooses where the file goes, then copies the already-written
 * temporary file there. Resolves { saved: false } if the user cancels.
 */
@CapacitorPlugin(name = "SaveAs")
public class SaveAsPlugin extends Plugin {

    @PluginMethod
    public void save(PluginCall call) {
        String path = call.getString("path");
        String filename = call.getString("filename");
        if (path == null || filename == null) {
            call.reject("path e filename sono obbligatori");
            return;
        }
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(call.getString("mimeType", "application/octet-stream"));
        intent.putExtra(Intent.EXTRA_TITLE, filename);
        startActivityForResult(call, intent, "onDocumentCreated");
    }

    @ActivityCallback
    private void onDocumentCreated(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) {
            JSObject ret = new JSObject();
            ret.put("saved", false);
            call.resolve(ret);
            return;
        }
        Uri target = data.getData();
        File source = new File(Uri.parse(call.getString("path")).getPath());
        // Copy off the main thread: a video export can be several MB.
        new Thread(() -> {
            try (
                InputStream in = new FileInputStream(source);
                OutputStream out = getContext().getContentResolver().openOutputStream(target)
            ) {
                if (out == null) {
                    throw new java.io.IOException("Impossibile aprire la destinazione");
                }
                byte[] buffer = new byte[64 * 1024];
                int read;
                while ((read = in.read(buffer)) != -1) {
                    out.write(buffer, 0, read);
                }
                JSObject ret = new JSObject();
                ret.put("saved", true);
                ret.put("uri", target.toString());
                call.resolve(ret);
            } catch (Exception e) {
                call.reject("Impossibile salvare il file: " + e.getMessage(), e);
            }
        }).start();
    }
}
