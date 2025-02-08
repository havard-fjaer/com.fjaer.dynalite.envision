import Homey from 'homey';

module.exports = class MyDevice extends Homey.Device {

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log('Dynalite Light device has been initialized');
    this.registerCapabilityListener("onoff", this.onCapabilityOnoff.bind(this));

  }

  async onCapabilityOnoff(value: boolean, opts: any) {
    // ... set value to real device, e.g.
    // await setMyDeviceState({ on: value });
    // or, throw an error
    // throw new Error('Switching the device failed!');
    const settings = this.getSettings();

    let level = -1;
    if (value) {
      this.log('Turning on the light');
      level = 100;
    } else {
      this.log('Turning off the light');
      level = 0;
    }
    
    let url = `http://${settings.host}/SetDyNet.cgi?a=${settings.area}&c=${settings.channel}&f=${settings.fade}&l=${level}`;
    
    this.log(`Calling ${url}`);
    await fetch(url).catch(this.error);
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
