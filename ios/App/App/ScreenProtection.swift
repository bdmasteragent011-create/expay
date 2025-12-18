import UIKit

class ScreenProtection {
    static let shared = ScreenProtection()
    private var secureField: UITextField?
    
    private init() {}
    
    func enableScreenProtection(in window: UIWindow?) {
        guard let window = window else { return }
        
        // Create a secure text field that prevents screenshots and screen recording
        let field = UITextField()
        field.isSecureTextEntry = true
        field.isUserInteractionEnabled = false
        
        // Add to window hierarchy
        window.addSubview(field)
        field.centerYAnchor.constraint(equalTo: window.centerYAnchor).isActive = true
        field.centerXAnchor.constraint(equalTo: window.centerXAnchor).isActive = true
        
        // Layer the secure field to protect content
        window.layer.superlayer?.addSublayer(field.layer)
        field.layer.sublayers?.first?.addSublayer(window.layer)
        
        self.secureField = field
        
        // Also add screen capture notification observers
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(screenCaptureChanged),
            name: UIScreen.capturedDidChangeNotification,
            object: nil
        )
    }
    
    @objc private func screenCaptureChanged() {
        if UIScreen.main.isCaptured {
            // Screen is being recorded - show blocking view
            showBlockingView()
        } else {
            // Screen recording stopped - remove blocking view
            hideBlockingView()
        }
    }
    
    private var blockingView: UIView?
    
    private func showBlockingView() {
        guard let window = UIApplication.shared.windows.first else { return }
        
        let view = UIView(frame: window.bounds)
        view.backgroundColor = .black
        view.tag = 999
        
        let label = UILabel()
        label.text = "Screen recording is not allowed"
        label.textColor = .white
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false
        
        view.addSubview(label)
        label.centerXAnchor.constraint(equalTo: view.centerXAnchor).isActive = true
        label.centerYAnchor.constraint(equalTo: view.centerYAnchor).isActive = true
        
        window.addSubview(view)
        blockingView = view
    }
    
    private func hideBlockingView() {
        blockingView?.removeFromSuperview()
        blockingView = nil
    }
}
