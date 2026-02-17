package com.geogram.app;

import android.content.Intent;
import android.net.Uri;
import android.util.Log;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

@CapacitorPlugin(name = "InstagramStories")
public class InstagramStoriesPlugin extends Plugin {

    @PluginMethod
    public void shareToStory(PluginCall call) {
        String base64Data = call.getString("base64");
        String appId = "962534345263628"; // Facebook App ID for Geogram - Replace if you have a specific one, using a
                                          // placeholder or generic one might fail if strict.
        // Ideally pass this from JS, but for now we can hardcode or pass it.
        // Actually, let's try WITHOUT the explicit app_id extra first, or use the one
        // from config if available.
        // Facebook's documentation says facebook_app_id is required.
        // Let's rely on the file sharing first.

        if (base64Data == null) {
            call.reject("No base64 data provided");
            return;
        }

        try {
            // 1. Convert Base64 to File
            File cachePath = new File(getContext().getCacheDir(), "images");
            cachePath.mkdirs(); // don't forget to make the directory
            File newFile = new File(cachePath, "story_share.png");

            // Basic Base64 decoding (strip prefix if present)
            if (base64Data.contains(",")) {
                base64Data = base64Data.split(",")[1];
            }

            byte[] decodedString = android.util.Base64.decode(base64Data, android.util.Base64.DEFAULT);
            FileOutputStream fo = new FileOutputStream(newFile);
            fo.write(decodedString);
            fo.flush();
            fo.close();

            // 2. Get Content URI via FileProvider
            Uri contentUri = FileProvider.getUriForFile(getContext(), "com.geogram.app.fileprovider", newFile);

            // 3. Construct Intent
            Intent intent = new Intent("com.instagram.share.ADD_TO_STORY");
            intent.setDataAndType(contentUri, "image/png");
            intent.setFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.setPackage("com.instagram.android");

            // Add the image as a sticker or background.
            // "interactive_asset_uri" -> Sticker
            // "source_application" -> Your app id (optional but good)
            intent.putExtra("interactive_asset_uri", contentUri);
            intent.putExtra("source_application", "962534345263628"); // Using Geogram's ID if known, or just a string

            // verify package exists
            if (getContext().getPackageManager().resolveActivity(intent, 0) != null) {
                getActivity().startActivityForResult(intent, 0);
                call.resolve();
            } else {
                call.reject("Instagram is not installed");
            }

        } catch (IOException e) {
            Log.e("InstagramStories", "Error writing file", e);
            call.reject("Failed to write file: " + e.getMessage());
        } catch (Exception e) {
            Log.e("InstagramStories", "Error sharing", e);
            call.reject("Error sharing: " + e.getMessage());
        }
    }
}
