import Homey from 'homey';

module.exports = class DynaliteLightDevice extends Homey.Device {

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log('Dynalite Light device has been initialized');
    this.registerCapabilityListener("onoff", this.onCapabilityOnoff.bind(this));
    this.registerCapabilityListener("dim", this.onCapabilityDim.bind(this));

  }

  async onCapabilityOnoff(value: boolean) {
    let level = value ? 100 : 0;
    await this.callGateway(level);    
  }

  onCapabilityDim(value: number) {
    // Convert 0-1 to 0-100
    let gatewayValue = Math.round(value * 100);
    this.callGateway(gatewayValue);
  }


  async callGateway(level: number) {
    const settings = this.getSettings();
    this.checkSettings(settings);
    let url = `http://${settings.host}/SetDyNet.cgi?a=${settings.area}&c=${settings.channel}&f=${settings.fade}&l=${level}`;

    this.log(`Calling ${url}`);
    await fetch(url).catch(this.error);
  }

  async checkSettings(settings: any) {
    let errors = [];
    if (!settings.host) {
      errors.push('No host configured');
    }
    if (!settings.area) {
      errors.push('No area configured');
    }
    if (!settings.channel) {
      errors.push('No channel configured');
    }
    if (!settings.fade) {
      errors.push('No fade configured');
    }
    if (errors.length > 0) {
      this.error(errors.join(', '));
      return false;
    }
    return true;
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('Dynalite Light device has been added');
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({
    oldSettings,
    newSettings,
    changedKeys,
  }: {
    oldSettings: { [key: string]: boolean | string | number | undefined | null };
    newSettings: { [key: string]: boolean | string | number | undefined | null };
    changedKeys: string[];
  }): Promise<string | void> {
    this.log("Dynalite Light device settings where changed");
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name: string) {
    this.log('Dynalite Light device was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('Dynalite Light device has been deleted');
  }

};
