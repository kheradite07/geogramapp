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
        String appId = "962534345263628";

        if (base64Data == null) {
            call.reject("No base64 data provided");
            return;
        }

        try {
            File newFile = saveBase64ToFile(base64Data, "story_share.png");
            Uri contentUri = FileProvider.getUriForFile(getContext(), "com.geogram.app.fileprovider", newFile);

            Intent intent = new Intent("com.instagram.share.ADD_TO_STORY");
            // To avoid "Double Image" (Background + Sticker), we must NOT set a type that
            // implies a background image
            // IF we aren't providing one. However, we DO need a type for the intent to
            // resolve.
            // Documentation implies:
            // - background: setDataAndType
            // - sticker: extract "interactive_asset_uri"
            // The issue is likely that "image/png" type without data might be defaulting to
            // something or
            // the sticker is being applied as background too?
            // Let's try setting the background explicitly to the solid color and NOT
            // setting the intent type to image/png
            // unless required. Actually, "image/*" is safer.
            // BUT, some findings suggest that if you setType, it expects data.
            // Let's try keeping setType but ensuring we don't accidentally set data.
            // Also, let's try passing the sticker only.

            intent.setType("image/*");
            intent.setPackage("com.instagram.android");

            // Sticker
            intent.putExtra("interactive_asset_uri", contentUri);
            intent.setFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            // Solid Brand Background (This should override any "image" background attempt)
            intent.putExtra("top_background_color", "#1a0033");
            intent.putExtra("bottom_background_color", "#1a0033");

            intent.putExtra("source_application", appId);

            if (getContext().getPackageManager().resolveActivity(intent, 0) != null) {
                getActivity().startActivityForResult(intent, 0);
                call.resolve();
            } else {
                call.reject("Instagram is not installed");
            }

        } catch (Exception e) {
            Log.e("InstagramStories", "Error sharing", e);
            call.reject("Error sharing: " + e.getMessage());
        }
    }

    @PluginMethod
    public void shareToWhatsApp(PluginCall call) {
        String base64Data = call.getString("base64");

        if (base64Data == null) {
            call.reject("No base64 data provided");
            return;
        }

        try {
            File newFile = saveBase64ToFile(base64Data, "whatsapp_share.png");
            Uri contentUri = FileProvider.getUriForFile(getContext(), "com.geogram.app.fileprovider", newFile);

            Intent intent = new Intent(Intent.ACTION_SEND);
            intent.setType("image/*"); // Changed from image/png to image/* for broader compatibility
            intent.setPackage("com.whatsapp");
            intent.putExtra(Intent.EXTRA_STREAM, contentUri);
            intent.putExtra(Intent.EXTRA_TEXT, "Check out this snapshot from Geogram!");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            // Verify with specific flags if needed, or just standard resolve
            if (getContext().getPackageManager().resolveActivity(intent, 0) != null) {
                getActivity().startActivityForResult(intent, 0);
                call.resolve();
            } else {
                // Try fallback to "com.whatsapp.w4b" (Business) if standard not found?
                // Or just reject. User said "WhatsApp button", assuming standard.
                call.reject("WhatsApp is not installed");
            }
        } catch (Exception e) {
            Log.e("InstagramStories", "Error sharing to WhatsApp", e);
            call.reject("Error sharing to WhatsApp: " + e.getMessage());
        }
    }

    private File saveBase64ToFile(String base64Data, String fileName) throws IOException {
        File cachePath = new File(getContext().getCacheDir(), "images");
        cachePath.mkdirs();
        File newFile = new File(cachePath, fileName);

        if (base64Data.contains(",")) {
            base64Data = base64Data.split(",")[1];
        }

        byte[] decodedString = android.util.Base64.decode(base64Data, android.util.Base64.DEFAULT);
        FileOutputStream fo = new FileOutputStream(newFile);
        fo.write(decodedString);
        fo.flush();
        fo.close();
        return newFile;
    }
}
