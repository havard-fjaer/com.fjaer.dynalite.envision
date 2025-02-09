export class SettingsWrapper {
    private device: any; // Kan være hvilken som helst Homey-enhet
    private settings: any;

    constructor(device: any) {
        this.device = device;
    }

    async init() {
        this.settings = this.device.getSettings();
        this.settings.host = this.device.homey.settings.get('host');
    }

    getSettings() {
        return this.settings;
    }

    public async settingsOk() {
        let errors = [];
        if (!this.settings.host || this.settings.host.length <= 1) errors.push('No host configured globally in app settings.');
        if (!this.settings.area) errors.push('No area configured for device.');
        if (!this.settings.channel) errors.push('No channel configured for device.');
        if (!this.settings.fade) errors.push('No fade configured for device.');
    
        if (errors.length > 0) {
          this.device.error('Please configure the Dynalite device in the Homey app. ' + errors.join(', '));
          return false
        }
        return true;
      }
    
}