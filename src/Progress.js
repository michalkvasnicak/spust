// @flow

import ProgressBar from 'progress';
import webpack from 'webpack';

type Compiler = {
  apply: Function,
};

export default class Progress {
  compilers: Array<Compiler>;
  interval: any;
  clientProgress: number = 0;
  serverProgress: number = 0;
  progressBar: any;

  constructor(compilers: Array<Compiler>) {
    this.compilers = compilers;

    // apply progress plugins to compilers
    if (compilers.length < 2) {
      throw new Error('Expecting 2 compiler instances, client and server');
    }

    // client side progeess
    compilers[0].apply(
      new webpack.ProgressPlugin(progress => {
        const lastProgress = this.clientProgress;

        this.clientProgress = progress;

        if (lastProgress !== progress) {
          this.progress();
        }
      }),
    );

    // server side progress
    compilers[1].apply(
      new webpack.ProgressPlugin(progress => {
        const lastProgress = this.serverProgress;

        this.serverProgress = progress;

        if (lastProgress !== progress) {
          this.progress();
        }
      }),
    );
  }

  progress = () => {
    this.tick(this.clientProgress * 50 + this.serverProgress * 50);
  };

  start = () => {
    this.stop();
    this.progressBar = new ProgressBar('compiling [:bar] :percent :elapseds', {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: 100,
    });
    this.interval = setInterval(this.progress, 250);
  };

  stop = () => {
    this.progressBar = null;
    clearInterval(this.interval);
    this.interval = null;
  };

  tick = (progressInPercent: number) => {
    if (this.progressBar != null) {
      this.progressBar.update(progressInPercent / 100);
      this.progressBar.render();
    }

    if (progressInPercent === 100) {
      this.stop();
    }
  };
}
