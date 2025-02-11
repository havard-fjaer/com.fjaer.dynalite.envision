// Checks if a device has changed indepentently of the Homey driver. If so, it will update the Homey device.
export class StatusChecker {
  private device: any;
  private intervalTime: number = 60; // Check every 60 seconds

  constructor(device: any, intervalTime?: number) {
    this.device = device;
    if (intervalTime) {
      this.intervalTime = intervalTime;
    }
  }

  start() {
    // Checker must be enabled per device. Checking all devices all the time might overload the Dynalite gateway.
    if (this.device.settingsWrapper.getSettings().statusCheckerEnabled) {
      // Stagger the initial check to avoid all devices checking at the same time
      let initialDelay = Math.floor(Math.random() * this.intervalTime);
      this.device.log(`Initial status check in ${initialDelay} seconds`);
      setTimeout(() => this.checkStatusTimer(), initialDelay * 1000);
    }
  }

  private async checkStatusTimer() {
    await this.checkStatus();
    setTimeout(() => this.checkStatusTimer(), this.intervalTime * 1000);
  }

  private async checkStatus() {
    if (!await this.device.settingsWrapper.settingsOk()) { return }
    const settings = this.device.settingsWrapper.getSettings();

    let url = `http://${settings.host}/GetDyNet.cgi?a=${settings.area}&c=${settings.channel}&_=${Date.now()}`;
    this.device.log(`Calling ${url}`);

    try {
      // Check status with the Dynalite gateway
      let response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

      // Get the light level from the response
      let text = await response.text();
      let match = text.match(/\d+/);
      // Default to 0 if no match. Some responses migt return l=. when off.
      let level = match ? parseInt(match[0]) : 0;

      this.device.setCapabilityValue("onoff", level > 0);
      if (this.device.hasCapability("dim")) {
        this.device.setCapabilityValue("dim", level / 100);
      }
    } catch (error) {
      this.device.error(`Failed to fetch from ${url}: ${error}`);
      this.device.setUnavailable().catch(this.device.error);
    }
  }
}