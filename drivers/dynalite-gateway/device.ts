import Homey from 'homey';

module.exports = class DynaliteLightDevice extends Homey.Device {

  // Light status be polled every 60 seconds, with a random initial delay, to avoid overloading the gateway.
  waitBeforeCheckLightStatus = 60; // Seconds
  
  // Homey Moods will turn on the light first, and then start dimming. 
  // We do not want to turn on the light if dimming is in progress, as turning on is the same as setting dim to 100%.
  // These variables control the timing, asking the onoff capability to wait and see 
  // if dimming is in progress, and then turn on the light if no dimming is in progress.
  waitBeforeTurnOnLight = 200;  // ms 
  // This value must be higher than waitBeforeTurnOnLight
  assumedDelayBetweenTurnOnAndDimming = 500; // ms

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log('Dynalite Light device has been initialized');
    this.registerCapabilityListener("onoff", this.onCapabilityOnoff.bind(this));
    this.registerCapabilityListener("dim", this.onCapabilityDim.bind(this));

    // Start status check with random initial delay, to avoid overloading the gateway
    let initialDelay = Math.floor(Math.random() * this.waitBeforeCheckLightStatus);
    this.log(`Initial status check in ${initialDelay} seconds`);
    setTimeout(() => {
      this.checkStatusTimer(); 
    }, initialDelay * 1000);
  }

  // Check status wrapper with 60 second interval
  async checkStatusTimer() {
    await this.checkStatus();
    this.log(`Next check in 60 seconds`);
    setTimeout(async () => {
      this.checkStatusTimer();
    }, this.waitBeforeCheckLightStatus * 1000); 
  }

  // Check device status
  async checkStatus() {
    const settings = this.getSettings();
    this.checkSettings(settings);

    // Construct URL
    let url = `http://${settings.host}/GetDyNet.cgi?a=${settings.area}&c=${settings.channel}&_=${Date.now()}`;

    this.log(`Calling ${url}`);
    let response = await fetch(url).catch(this.error);
    if (!response || !response.ok) {
      this.error(`Failed to fetch from ${url}`);
      return;
    }

    let text = await response.text(); 
    this.log(`Current dim level: ${text}`);

    // Parse response, i.e l=28
    let match = text.match(/\d+/); // Extract number
    let level = match ? parseInt(match[0]) : 0; // Convert to number, assume 0 if no match


    // Update device state
    let dimLevel = level / 100;
    this.setCapabilityValue("dim", dimLevel);
    this.setCapabilityValue("onoff", level > 0);
  }


  // Handle on/off capability
  async onCapabilityOnoff(value: boolean) {

    // Turn off light when value is false
    if (value === false) {
      await this.dimLight(0);
      return;
    }

    // Wait and see if we will be dimming some time during the next few ms
    await new Promise(resolve => setTimeout(resolve, this.waitBeforeTurnOnLight));
    // If dimming is in progress, we skip the turn on
    if (this.dimmingInProgress) {
      this.log('Dimming is still in progress, skipping turn on');
      return;
    }

    // Turn on light to 100% 
    await this.dimLight(100);
    this.log('Turned on after waiting for dimming');
  }

  // Handle dim capability
  async onCapabilityDim(value: number) {
    
    // Inform on/off capability that we are starting a dimming process
    this.startDimmingProcess();

    // Convert 0-1 to 0-100
    let dimLevel = Math.round(value * 100);

    // Dim light
    await this.dimLight(dimLevel);
  }

  // Variable to track dimming status
  private dimmingTimer: NodeJS.Timeout | null = null;
  dimmingInProgress = false;


  // Start dimming process with a controlled timeout
  startDimmingProcess() {
    this.dimmingInProgress = true;

    if (this.dimmingTimer) {
      clearTimeout(this.dimmingTimer); // Reset timer
    }

    // Assume that there will be a delay between turning on the light and starting dimming
    this.dimmingTimer = setTimeout(() => {
      this.dimmingInProgress = false;
      this.dimmingTimer = null;
    }, this.assumedDelayBetweenTurnOnAndDimming); 
  }

  // Dim light, level 0-100
  async dimLight(level: number) {
    const settings = this.getSettings();
    this.checkSettings(settings);

    // Construct URL
    let url = `http://${settings.host}/SetDyNet.cgi?a=${settings.area}&c=${settings.channel}&f=${settings.fade}&l=${level}`;

    this.log(`Calling ${url}`);
    await fetch(url).catch(this.error);
  }

  // Check that all settings are present
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
      throw new Error(errors.join(', '));
    }
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
