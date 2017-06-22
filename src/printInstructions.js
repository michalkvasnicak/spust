// @flow

import chalk from 'chalk';
import { existsSync } from 'fs';
import { resolve } from 'path';

const useYarn = existsSync(resolve(process.cwd(), './yarn.lock'));

type Urls = { lanUrlForTerminal: ?string, localUrlForTerminal: string };

export default function printInstructions({ lanUrlForTerminal, localUrlForTerminal }: Urls) {
  console.log();
  console.log(`You can now view your application in the browser.`);
  console.log();

  if (lanUrlForTerminal) {
    console.log(`  ${chalk.bold('Local:')}            ${localUrlForTerminal}`);
    console.log(`  ${chalk.bold('On Your Network:')}  ${lanUrlForTerminal}`);
  } else {
    console.log(`  ${localUrlForTerminal}`);
  }

  console.log();
  console.log('');
  console.log(
    `
${chalk.yellow('Note that the development build is not optimized.')}

To create a production build use ${chalk.cyan(
      useYarn ? 'yarn spust build' : 'node ./node_modules/.bin/spust build',
    )}
    `.trim(),
  );
  console.log();
}
