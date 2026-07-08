import ExpoModulesCore
import CoreBluetooth

/**
 * PulseBle (iOS peripheral) — advertise the Loadit service + @handle and serve a
 * GATT characteristic that receives signed Pulse notes. Cross-platform: an
 * Android or iOS central (react-native-ble-plx) scans for the service, reads the
 * @handle, connects, and writes the note. iOS advertises the @handle in the
 * local name (iOS can't put custom service data in an advert); centrals read it
 * there, or read the handle characteristic after connecting.
 *
 * Note framing: writes are accumulated until a newline (0x0A) terminator, then
 * the assembled UTF-8 payload is emitted.
 */

private let kService = CBUUID(string: "F0AD1E00-1985-4C5A-9B11-9E7A10ADD17E")
private let kHandleChar = CBUUID(string: "F0AD1E01-1985-4C5A-9B11-9E7A10ADD17E")
private let kNoteChar = CBUUID(string: "F0AD1E02-1985-4C5A-9B11-9E7A10ADD17E")

final class PulseBlePeripheral: NSObject, CBPeripheralManagerDelegate {
  private var manager: CBPeripheralManager?
  private var handle: String = "loadit"
  private var buffer = Data()
  private var wantsStart = false
  var onNote: ((String) -> Void)?
  var onErr: ((String) -> Void)?

  func start(handle: String) {
    self.handle = handle
    buffer.removeAll()
    wantsStart = true
    if manager == nil {
      manager = CBPeripheralManager(delegate: self, queue: nil)
    } else if manager?.state == .poweredOn {
      setupAndAdvertise()
    }
  }

  func stop() {
    wantsStart = false
    manager?.stopAdvertising()
    manager?.removeAllServices()
  }

  func peripheralManagerDidUpdateState(_ peripheral: CBPeripheralManager) {
    if peripheral.state == .poweredOn {
      if wantsStart { setupAndAdvertise() }
    } else {
      onErr?("Bluetooth is off")
    }
  }

  private func setupAndAdvertise() {
    guard let m = manager else { return }
    m.stopAdvertising()
    m.removeAllServices()
    let handleChar = CBMutableCharacteristic(
      type: kHandleChar, properties: [.read], value: handle.data(using: .utf8), permissions: [.readable])
    let noteChar = CBMutableCharacteristic(
      type: kNoteChar, properties: [.write, .writeWithoutResponse], value: nil, permissions: [.writeable])
    let service = CBMutableService(type: kService, primary: true)
    service.characteristics = [handleChar, noteChar]
    m.add(service)
    m.startAdvertising([
      CBAdvertisementDataServiceUUIDsKey: [kService],
      CBAdvertisementDataLocalNameKey: handle,
    ])
  }

  // Max bytes we'll buffer before a newline. A Pulse note is a few hundred
  // bytes; anything past this is a peer streaming garbage to exhaust memory, so
  // we drop the buffer rather than crash.
  private let kMaxBuffer = 8192

  func peripheralManager(_ peripheral: CBPeripheralManager, didReceiveWrite requests: [CBATTRequest]) {
    for req in requests {
      if req.characteristic.uuid == kNoteChar, let val = req.value {
        buffer.append(val)
        if let nl = buffer.firstIndex(of: 0x0A) {
          let noteData = buffer.subdata(in: buffer.startIndex..<nl)
          buffer.removeSubrange(buffer.startIndex...nl)
          if let s = String(data: noteData, encoding: .utf8), !s.isEmpty { onNote?(s) }
        } else if buffer.count > kMaxBuffer {
          buffer.removeAll(keepingCapacity: false) // unterminated flood — discard
        }
      }
    }
    if let first = requests.first { peripheral.respond(to: first, withResult: .success) }
  }

  func peripheralManager(_ peripheral: CBPeripheralManager, didReceiveRead request: CBATTRequest) {
    if request.characteristic.uuid == kHandleChar {
      request.value = handle.data(using: .utf8)
      peripheral.respond(to: request, withResult: .success)
    } else {
      peripheral.respond(to: request, withResult: .attributeNotFound)
    }
  }
}

public class PulseBleModule: Module {
  private var peripheral: PulseBlePeripheral?

  public func definition() -> ModuleDefinition {
    Name("PulseBle")

    Events("onNoteReceived", "onError")

    Function("isAvailable") { () -> Bool in true }

    AsyncFunction("startPeripheral") { (handle: String) in
      let p = self.peripheral ?? PulseBlePeripheral()
      p.onNote = { [weak self] s in self?.sendEvent("onNoteReceived", ["payload": s]) }
      p.onErr = { [weak self] m in self?.sendEvent("onError", ["message": m]) }
      p.start(handle: handle)
      self.peripheral = p
    }

    AsyncFunction("stopPeripheral") { self.peripheral?.stop() }

    OnDestroy { self.peripheral?.stop() }
  }
}
