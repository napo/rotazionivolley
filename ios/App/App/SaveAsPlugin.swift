import UIKit
import Capacitor

/// Native "Save as" for exports (see web/src/export/platformSave.ts): shows
/// the Files export picker so the user chooses where the file goes; the
/// already-written temporary file is copied there. Resolves { saved: false }
/// if the user cancels.
@objc(SaveAsPlugin)
public class SaveAsPlugin: CAPPlugin, CAPBridgedPlugin, UIDocumentPickerDelegate {
    public let identifier = "SaveAsPlugin"
    public let jsName = "SaveAs"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "save", returnType: CAPPluginReturnPromise)
    ]

    private var pendingCall: CAPPluginCall?

    @objc func save(_ call: CAPPluginCall) {
        guard let path = call.getString("path"), let url = URL(string: path) else {
            call.reject("path è obbligatorio")
            return
        }
        DispatchQueue.main.async {
            let picker = UIDocumentPickerViewController(forExporting: [url], asCopy: true)
            picker.delegate = self
            self.pendingCall = call
            self.bridge?.viewController?.present(picker, animated: true)
        }
    }

    public func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        pendingCall?.resolve(["saved": true, "uri": urls.first?.absoluteString ?? ""])
        pendingCall = nil
    }

    public func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
        pendingCall?.resolve(["saved": false])
        pendingCall = nil
    }
}

/// Bridge view controller that registers the app's local plugins.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(SaveAsPlugin())
    }
}
