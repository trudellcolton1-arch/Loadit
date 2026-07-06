package expo.modules.pulseble

import android.annotation.SuppressLint
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattServer
import android.bluetooth.BluetoothGattServerCallback
import android.bluetooth.BluetoothGattService
import android.bluetooth.BluetoothManager
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.bluetooth.le.BluetoothLeAdvertiser
import android.content.Context
import android.os.ParcelUuid
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.UUID

/**
 * PulseBle (Android peripheral) — advertise the Loadit service + @handle and run
 * a GATT server whose note characteristic receives signed Pulse notes written by
 * a central (ble-plx, iOS or Android), and whose handle characteristic lets a
 * central read who this phone belongs to.
 *
 * IMPORTANT: addService() is asynchronous. We start advertising only AFTER
 * onServiceAdded fires — otherwise a central (esp. iOS) can connect before the
 * service exists and every read/write fails. We also implement the connection
 * and MTU callbacks iOS negotiation expects.
 */

private val SERVICE_UUID: UUID = UUID.fromString("F0AD1E00-1985-4C5A-9B11-9E7A10ADD17E")
private val HANDLE_UUID: UUID = UUID.fromString("F0AD1E01-1985-4C5A-9B11-9E7A10ADD17E")
private val NOTE_UUID: UUID = UUID.fromString("F0AD1E02-1985-4C5A-9B11-9E7A10ADD17E")

class PulseBleModule : Module() {
  private var gattServer: BluetoothGattServer? = null
  private var advertiser: BluetoothLeAdvertiser? = null
  private var advertiseCallback: AdvertiseCallback? = null
  private var handle: String = "loadit"
  private val buffer = StringBuilder()

  private val context: Context
    get() = requireNotNull(appContext.reactContext)

  private val serverCallback = object : BluetoothGattServerCallback() {
    override fun onServiceAdded(status: Int, service: BluetoothGattService?) {
      // Service is live now — safe to advertise so centrals that connect find it.
      startAdvertisingInternal()
    }

    override fun onConnectionStateChange(device: BluetoothDevice?, status: Int, newState: Int) {
      // No-op, but implementing it keeps the server stable across iOS connects.
    }

    override fun onMtuChanged(device: BluetoothDevice?, mtu: Int) {
      // Accept whatever MTU the central negotiates (iOS bumps this on connect).
    }

    @SuppressLint("MissingPermission")
    override fun onCharacteristicWriteRequest(
      device: BluetoothDevice, requestId: Int, characteristic: BluetoothGattCharacteristic,
      preparedWrite: Boolean, responseNeeded: Boolean, offset: Int, value: ByteArray
    ) {
      if (characteristic.uuid == NOTE_UUID) {
        val chunk = String(value, Charsets.UTF_8)
        val nl = chunk.indexOf('\n')
        if (nl >= 0) {
          buffer.append(chunk.substring(0, nl))
          val payload = buffer.toString()
          buffer.setLength(0)
          if (payload.isNotEmpty()) sendEvent("onNoteReceived", mapOf("payload" to payload))
        } else {
          buffer.append(chunk)
        }
      }
      if (responseNeeded) {
        gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, null)
      }
    }

    @SuppressLint("MissingPermission")
    override fun onCharacteristicReadRequest(
      device: BluetoothDevice, requestId: Int, offset: Int, characteristic: BluetoothGattCharacteristic
    ) {
      if (characteristic.uuid == HANDLE_UUID) {
        val bytes = handle.toByteArray(Charsets.UTF_8)
        val slice = if (offset >= bytes.size) ByteArray(0) else bytes.copyOfRange(offset, bytes.size)
        gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, slice)
      } else {
        gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_FAILURE, offset, null)
      }
    }
  }

  override fun definition() = ModuleDefinition {
    Name("PulseBle")

    Events("onNoteReceived", "onError")

    Function("isAvailable") { true }

    AsyncFunction("startPeripheral") { h: String -> startPeripheral(h) }

    AsyncFunction("stopPeripheral") { stopPeripheral() }

    OnDestroy { stopPeripheral() }
  }

  @SuppressLint("MissingPermission")
  private fun startPeripheral(h: String) {
    handle = h
    buffer.setLength(0)
    stopPeripheral()

    val mgr = context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
    val adapter = mgr?.adapter
    if (adapter == null || !adapter.isEnabled) {
      sendEvent("onError", mapOf("message" to "Bluetooth is off"))
      return
    }

    val server = mgr.openGattServer(context, serverCallback)
    if (server == null) {
      sendEvent("onError", mapOf("message" to "Couldn't start GATT server"))
      return
    }
    gattServer = server

    val service = BluetoothGattService(SERVICE_UUID, BluetoothGattService.SERVICE_TYPE_PRIMARY)
    service.addCharacteristic(
      BluetoothGattCharacteristic(HANDLE_UUID, BluetoothGattCharacteristic.PROPERTY_READ, BluetoothGattCharacteristic.PERMISSION_READ)
    )
    service.addCharacteristic(
      BluetoothGattCharacteristic(
        NOTE_UUID,
        BluetoothGattCharacteristic.PROPERTY_WRITE or BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE,
        BluetoothGattCharacteristic.PERMISSION_WRITE
      )
    )
    // Advertising starts in onServiceAdded once this completes.
    server.addService(service)
  }

  @SuppressLint("MissingPermission")
  private fun startAdvertisingInternal() {
    val mgr = context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
    val adapter = mgr?.adapter ?: return
    val adv = adapter.bluetoothLeAdvertiser
    if (adv == null) {
      sendEvent("onError", mapOf("message" to "BLE advertising not supported on this phone"))
      return
    }
    val settings = AdvertiseSettings.Builder()
      .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
      .setConnectable(true)
      .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
      .build()
    val advData = AdvertiseData.Builder()
      .setIncludeDeviceName(false)
      .addServiceUuid(ParcelUuid(SERVICE_UUID))
      .build()
    val scanResponse = AdvertiseData.Builder()
      .addServiceData(ParcelUuid(SERVICE_UUID), handle.toByteArray(Charsets.UTF_8))
      .build()
    val cb = object : AdvertiseCallback() {
      override fun onStartFailure(errorCode: Int) {
        sendEvent("onError", mapOf("message" to "Advertise failed: $errorCode"))
      }
    }
    adv.startAdvertising(settings, advData, scanResponse, cb)
    advertiser = adv
    advertiseCallback = cb
  }

  @SuppressLint("MissingPermission")
  private fun stopPeripheral() {
    advertiseCallback?.let { advertiser?.stopAdvertising(it) }
    advertiseCallback = null
    advertiser = null
    gattServer?.close()
    gattServer = null
    buffer.setLength(0)
  }
}
