import ExpoModulesCore
import MultipeerConnectivity

/**
 * PulseMultipeer — offline phone-to-phone transport for signed Pulse notes.
 *
 * Uses Apple MultipeerConnectivity (Bluetooth LE + peer-to-peer Wi-Fi / AWDL),
 * the same offline mesh AirDrop rides on. Every device can both advertise
 * (sender) and browse (receiver); a signed note is just a UTF-8 payload sent
 * over an encrypted session. No internet, no pairing UI, no special entitlement.
 *
 * The @objc MultipeerConnectivity delegates live on a dedicated NSObject helper
 * (`PulseMPC`); the Expo module owns it and forwards its callbacks as JS events.
 */

private let kServiceType = "loadit-pulse" // 1–15 chars, lowercase + hyphen

final class PulseMPC: NSObject {
  private let myPeerID: MCPeerID
  let session: MCSession
  private var advertiser: MCNearbyServiceAdvertiser?
  private var browser: MCNearbyServiceBrowser?
  private var found: [String: MCPeerID] = [:]
  var autoAccept = true

  var onFound: ((String) -> Void)?
  var onLost: ((String) -> Void)?
  var onState: ((String, String) -> Void)?
  var onNote: ((String) -> Void)?
  var onErr: ((String) -> Void)?

  init(displayName: String) {
    let trimmed = displayName.isEmpty ? "loadit" : String(displayName.prefix(60))
    myPeerID = MCPeerID(displayName: trimmed)
    session = MCSession(peer: myPeerID, securityIdentity: nil, encryptionPreference: .required)
    super.init()
    session.delegate = self
  }

  func advertise() {
    let a = MCNearbyServiceAdvertiser(peer: myPeerID, discoveryInfo: nil, serviceType: kServiceType)
    a.delegate = self
    a.startAdvertisingPeer()
    advertiser = a
  }

  func browse() {
    let b = MCNearbyServiceBrowser(peer: myPeerID, serviceType: kServiceType)
    b.delegate = self
    b.startBrowsingForPeers()
    browser = b
  }

  func invite(_ key: String) {
    guard let peer = found[key], let b = browser else { return }
    b.invitePeer(peer, to: session, withContext: nil, timeout: 20)
  }

  func send(_ payload: String) -> Bool {
    guard !session.connectedPeers.isEmpty, let data = payload.data(using: .utf8) else { return false }
    do {
      try session.send(data, toPeers: session.connectedPeers, with: .reliable)
      return true
    } catch {
      onErr?(error.localizedDescription)
      return false
    }
  }

  func stop() {
    advertiser?.stopAdvertisingPeer(); advertiser = nil
    browser?.stopBrowsingForPeers(); browser = nil
    session.disconnect()
    found.removeAll()
  }
}

extension PulseMPC: MCSessionDelegate {
  func session(_ session: MCSession, peer peerID: MCPeerID, didChange state: MCSessionState) {
    let str: String
    switch state {
    case .connected: str = "connected"
    case .connecting: str = "connecting"
    default: str = "disconnected"
    }
    onState?(peerID.displayName, str)
  }

  func session(_ session: MCSession, didReceive data: Data, fromPeer peerID: MCPeerID) {
    if let payload = String(data: data, encoding: .utf8) { onNote?(payload) }
  }

  func session(_ session: MCSession, didReceive stream: InputStream, withName streamName: String, fromPeer peerID: MCPeerID) {}
  func session(_ session: MCSession, didStartReceivingResourceWithName resourceName: String, fromPeer peerID: MCPeerID, with progress: Progress) {}
  func session(_ session: MCSession, didFinishReceivingResourceWithName resourceName: String, fromPeer peerID: MCPeerID, at localURL: URL?, withError error: Error?) {}
}

extension PulseMPC: MCNearbyServiceAdvertiserDelegate {
  func advertiser(_ advertiser: MCNearbyServiceAdvertiser, didReceiveInvitationFromPeer peerID: MCPeerID, withContext context: Data?, invitationHandler: @escaping (Bool, MCSession?) -> Void) {
    invitationHandler(autoAccept, session)
  }
  func advertiser(_ advertiser: MCNearbyServiceAdvertiser, didNotStartAdvertisingPeer error: Error) {
    onErr?(error.localizedDescription)
  }
}

extension PulseMPC: MCNearbyServiceBrowserDelegate {
  func browser(_ browser: MCNearbyServiceBrowser, foundPeer peerID: MCPeerID, withDiscoveryInfo info: [String: String]?) {
    found[peerID.displayName] = peerID
    onFound?(peerID.displayName)
  }
  func browser(_ browser: MCNearbyServiceBrowser, lostPeer peerID: MCPeerID) {
    found[peerID.displayName] = nil
    onLost?(peerID.displayName)
  }
  func browser(_ browser: MCNearbyServiceBrowser, didNotStartBrowsingForPeers error: Error) {
    onErr?(error.localizedDescription)
  }
}

public class PulseMultipeerModule: Module {
  private var mpc: PulseMPC?

  public func definition() -> ModuleDefinition {
    Name("PulseMultipeer")

    Events("onPeerFound", "onPeerLost", "onPeerStateChange", "onReceiveNote", "onError")

    Function("isAvailable") { () -> Bool in true }

    AsyncFunction("start") { (displayName: String) in
      let mpc = PulseMPC(displayName: displayName)
      mpc.onFound = { [weak self] p in self?.sendEvent("onPeerFound", ["peer": p]) }
      mpc.onLost = { [weak self] p in self?.sendEvent("onPeerLost", ["peer": p]) }
      mpc.onState = { [weak self] p, st in self?.sendEvent("onPeerStateChange", ["peer": p, "state": st]) }
      mpc.onNote = { [weak self] payload in self?.sendEvent("onReceiveNote", ["payload": payload]) }
      mpc.onErr = { [weak self] m in self?.sendEvent("onError", ["message": m]) }
      self.mpc = mpc
    }

    AsyncFunction("advertise") { self.mpc?.advertise() }

    AsyncFunction("browse") { self.mpc?.browse() }

    AsyncFunction("invite") { (peer: String) in self.mpc?.invite(peer) }

    AsyncFunction("sendNote") { (payload: String) -> Bool in self.mpc?.send(payload) ?? false }

    AsyncFunction("stop") {
      self.mpc?.stop()
      self.mpc = nil
    }

    OnDestroy {
      self.mpc?.stop()
      self.mpc = nil
    }
  }
}
