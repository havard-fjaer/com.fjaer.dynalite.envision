
import DynaliteDevice from '../DynaliteDevice';

export default class DynaliteDimmableLight extends DynaliteDevice {

  async onInit() {
    super.onInit()
    this.registerCapabilityListener("dim", this.onCapabilityDim.bind(this));
  }

  async onCapabilityDim(value: number) {
    this.startDimmingProcess();
    await this.setLightLevel(value);
  }
  private dimmingInProgress = false;


  private dimmingTimer: NodeJS.Timeout | null = null;

  // Inform on/off capability that we are starting a dimming process
  startDimmingProcess() {
    this.dimmingInProgress = true;
    if (this.dimmingTimer) clearTimeout(this.dimmingTimer);

    // Assume that there will be a delay between turning on the light and starting dimming
    this.dimmingTimer = setTimeout(() => {
      this.dimmingInProgress = false;
      this.dimmingTimer = null;
    }, this.assumedDelayBetweenTurnOnAndDimming);
  }

  protected async prepareLightLevel(): Promise<number | null> {
    // Vent noen millisekunder for å se om en dimmekommando kommer inn
    await new Promise(resolve => setTimeout(resolve, this.waitBeforeTurnOnLight));

    // Hvis dimming er i gang, returner `null` for å avbryte "onoff"-kommandoen
    if (this.dimmingInProgress) {
      this.log('Dimming is still in progress, skipping turn on');
      return null;
    }

    // Hvis ingen dimmekommando kom, sett nivået til nåværende dim-verdi (eller 1 som fallback)
    return this.getCapabilityValue("dim") || 1;
  }

}

module.exports = DynaliteDimmableLight;