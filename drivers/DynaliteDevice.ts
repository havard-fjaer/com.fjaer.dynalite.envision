import Homey from 'homey';

export default class DynaliteDevice extends Homey.Device {
  // Light status be polled every 60 seconds, with a random initial delay, to avoid overloading the gateway.
  waitBeforeCheckLightStatus = 120; // Seconds

  // Homey Moods will turn on the light first, and then start dimming. 
  // We do not want to turn on the light if dimming is in progress, as turning on is the same as setting dim to 100%.
  // These variables control the timing, asking the onoff capability to wait and see 
  // if dimming is in progress, and then turn on the light if no dimming is in progress.
  waitBeforeTurnOnLight = 200;  // ms 
  // This value must be higher than waitBeforeTurnOnLight
  assumedDelayBetweenTurnOnAndDimming = 500; // ms


  protected dimmingInProgress = false;

  async onInit() {
    this.log(`${this.constructor.name} has been initialized`);
    this.registerCapabilityListener("onoff", this.onCapabilityOnoff.bind(this));



    this.initStatusChecker();
  }

  async initStatusChecker() {
  // Check if status checker is enabled
  if (this.getSettings().statusCheckerEnabled) {
      // Start status check with random initial delay, to avoid overloading the gateway
      let initialDelay = Math.floor(Math.random() * this.waitBeforeCheckLightStatus);
      this.log(`Initial status check in ${initialDelay} seconds`);
      setTimeout(() => this.checkStatusTimer(), initialDelay * 1000);
    }
  }

    // Check status with 60 second interval
async checkStatusTimer() {
    await this.checkStatus();
    setTimeout(() => this.checkStatusTimer(), this.waitBeforeCheckLightStatus * 1000);
  }

    // Check device status
async checkStatus() {
    const settings = this.getSettings();
    this.checkSettings(settings);

    let url = `http://${settings.host}/GetDyNet.cgi?a=${settings.area}&c=${settings.channel}&_=${Date.now()}`;
    this.log(`Calling ${url}`);

    try {
      let response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

      let text = await response.text();
    // Parse response, i.e l=28
    let match = text.match(/\d+/);
      let level = match ? parseInt(match[0]) : 0;

      this.setCapabilityValue("onoff", level > 0);
      if (this.hasCapability("dim")) {
        this.setCapabilityValue("dim", level / 100);
      }

    } catch (error) {
      this.error(`Failed to fetch from ${url}: ${error}`);
      this.setUnavailable().catch(this.error);
    }
  }

  async onCapabilityOnoff(value: boolean) {
    if (value === false) {
      await this.setLightLevel(0);
      return;
    }

    let level = 0;
    // Has dim capability, so we can dim the light
    if (this.hasCapability("dim")) {
    // Wait and see if we will be dimming some time during the next few ms
    await new Promise(resolve => setTimeout(resolve, this.waitBeforeTurnOnLight));
    // If dimming is in progress, we skip the turn on
    if (this.dimmingInProgress) {
        this.log('Dimming is still in progress, skipping turn on');
        return;
      }
      level = this.getCapabilityValue("dim") || 1;
    } else {
      level = 1;
    }

    await this.setLightLevel(level);
  }

  async setLightLevel(level: number) {
    const settings = this.getSettings();
    this.checkSettings(settings);
    let dynaliteDimLevel = Math.round(level * 100);

    let url = `http://${settings.host}/SetDyNet.cgi?a=${settings.area}&c=${settings.channel}&f=${settings.fade}&l=${dynaliteDimLevel}&_=${Date.now()}`;
    this.log(`Calling ${url}`);

    await fetch(url).catch(this.error);
    this.setCapabilityValue("onoff", level > 0);
    if (this.hasCapability("dim")) {
      this.setCapabilityValue("dim", level);
    }
  }

  async checkSettings(settings: any) {
    let errors = [];
    if (!settings.host) errors.push('No host configured');
    if (!settings.area) errors.push('No area configured');
    if (!settings.channel) errors.push('No channel configured');
    if (!settings.fade) errors.push('No fade configured');

    if (errors.length > 0) {
      this.error(errors.join(', '));
      throw new Error(errors.join(', '));
    }
  }

  async onAdded() {
    this.log('Dynalite Device added');
  }

  async onSettings({ changedKeys }: { changedKeys: string[] }) {
    this.log(`Settings changed: ${changedKeys.join(', ')}`);
  }

  async onRenamed(name: string) {
    this.log(`Dynalite Device renamed to ${name}`);
  }

  async onDeleted() {
    this.log('Dynalite Device deleted');
  }
}

