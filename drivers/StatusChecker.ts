export class StatusChecker {
    private device: any; // Kan være hvilken som helst Homey-enhet
    private intervalTime: number = 60; // Standard sjekk hvert 60. sekund
  
    constructor(device: any, intervalTime?: number) {
      this.device = device;
      if (intervalTime) {
        this.intervalTime = intervalTime;
      }
    }
  
    start() {
      if (this.device.settingsWrapper.getSettings().statusCheckerEnabled) {
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
        let response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
  
        let text = await response.text();
        let match = text.match(/\d+/);
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