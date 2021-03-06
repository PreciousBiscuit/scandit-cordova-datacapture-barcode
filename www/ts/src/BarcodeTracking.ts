/// <amd-module name="scandit-cordova-datacapture-barcode.BarcodeTracking"/>
// ^ needed because Cordova can't resolve "../xx" style dependencies
import { BarcodeTrackingListener } from 'BarcodeTracking+Related';
import { BarcodeTrackingSettings } from 'BarcodeTrackingSettings';
import { CameraSettings } from 'Camera+Related';
import { BarcodeTrackingListenerProxy } from 'Cordova/BarcodeTrackingListenerProxy';
import { Cordova } from 'Cordova/Cordova';
import {
    DataCaptureContext,
    DataCaptureMode,
    PrivateDataCaptureContext,
    PrivateDataCaptureMode,
} from 'DataCaptureContext';
import { DefaultSerializeable, ignoreFromSerialization, nameForSerialization } from 'Serializeable';

export interface PrivateBarcodeTracking extends PrivateDataCaptureMode {
    _context: Optional<DataCaptureContext>;
    didChange: () => Promise<void>;
}

export class BarcodeTracking extends DefaultSerializeable implements DataCaptureMode {
    public get isEnabled(): boolean {
        return this._isEnabled;
    }

    public set isEnabled(isEnabled: boolean) {
        this._isEnabled = isEnabled;
        if (!this.isInListenerCallback) {
            // If we're "in" a listener callback, we don't want to deserialize the context to update the enabled state,
            // but rather pass that back to be applied in the native callback.
            this.didChange();
        }
    }

    public get context(): Optional<DataCaptureContext> {
        return this._context;
    }

    public static get recommendedCameraSettings(): CameraSettings {
        return Cordova.defaults.BarcodeTracking.RecommendedCameraSettings;
    }

    private type = 'barcodeTracking';
    @nameForSerialization('enabled')
    private _isEnabled: boolean = true;

    private settings: BarcodeTrackingSettings;

    @ignoreFromSerialization
    private _context: Optional<DataCaptureContext> = null;

    @ignoreFromSerialization
    private listeners: BarcodeTrackingListener[] = [];

    @ignoreFromSerialization
    private listenerProxy: Optional<BarcodeTrackingListenerProxy> = null;
    private isInListenerCallback = false;

    public static forContext(
        context: Optional<DataCaptureContext>, settings: BarcodeTrackingSettings): BarcodeTracking {
        const barcodeTracking = new BarcodeTracking();

        barcodeTracking.settings = settings;

        if (context) {
            context.addMode(barcodeTracking);
        }

        barcodeTracking.listenerProxy = BarcodeTrackingListenerProxy.forBarcodeTracking(barcodeTracking);

        return barcodeTracking;
    }

    public applySettings(settings: BarcodeTrackingSettings): Promise<void> {
        this.settings = settings;
        return this.didChange();
    }

    public addListener(listener: BarcodeTrackingListener): void {
        if (!listener) {
            return;
        }

        if (this.listeners.includes(listener)) {
            return;
        }
        this.listeners.push(listener);
    }

    public removeListener(listener: BarcodeTrackingListener): void {
        if (!listener) {
            return;
        }

        if (!this.listeners.includes(listener)) {
            return;
        }
        this.listeners.splice(this.listeners.indexOf(listener), 1);
    }

    private didChange(): Promise<void> {
        if (this.context) {
            return (this.context as any as PrivateDataCaptureContext).update();
        } else {
            return Promise.resolve();
        }
    }
}
