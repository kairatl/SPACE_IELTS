import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jsonPath = path.join(__dirname, '..', 'js', 'data', 'reading_test_1.json');

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const byNum = {
  1: "It is the world's only flightless parrot",
  2: 'but only in years when food is plentiful',
  3: 'Males play no part in incubation or chick-rearing',
  4: 'With them came the Polynesian dog and rat',
  5: 'predation by feral cats on Rakiura Island',
  6: 'rescuing and hand-raising any failing chicks',
  7: 'bulbs, and fern fronds',
  8: 'The 1-4 eggs are laid in soil',
  9: 'used its feathers to make soft cloaks',
  10: 'introduced species such as deer',
  11: 'in 1980 it was confirmed females were also present',
  12: 'a higher amount of funding',
  13: 'ensure stakeholders continue to be fully engaged in the preservation of the species',
  14: 'opportunities are limited as the number of these mature survivors is relatively small',
  15: 'You\u2019re replacing a native species with a horticultural analogue',
  16: "in the '70s a second epidemic was triggered by shipments of elm from Canada",
  17: 'Strong winds from the sea make it difficult for the determined elm bark beetle',
  18: 'Once the trunk of the elm reaches 10-15 centimetres or so in diameter',
  19: 'You return in four to six weeks and trees that are resistant show no symptoms',
  20: 'Sometimes the best thing you can do is just give nature time to recover',
  21: 'The key, Russell says, is to identify and study those trees that have survived',
  22: 'the threat is right on our doorstep',
  23: 'You look at old photographs from the 1960s',
  24: 'elm ran a close second to oak',
  25: 'storage crates and flooring',
  26: 'keel of the l9th-century sailing ship Cutty Sark',
  27: 'we are all sometimes required to weigh up information under stressful conditions',
  28: 'These ups and downs presented the perfect setting for an experiment',
  29: 'We asked the firefighters to estimate their likelihood of experiencing 40 different adverse events',
  30: 'unexpected warning signs, such as faces expressing fear',
  31: 'they will ignore bad news and embrace the good',
  32: 'they became hyper-vigilant to bad news',
  33: 'stress didn\u2019t change how they responded to good news',
  34: 'told they had to give a surprise public speech',
  35: 'perceived threat acted as a trigger for a stress reaction',
  36: 'we will in turn create more negative posts',
  37: 'Repeatedly checking your phone, according to a survey conducted by the American Psychological Association',
  38: 'temporarily enhances the likelihood that people will take in negative reports',
  39: 'trips are cancelled, even if the disaster took place across the globe',
  40: 'positive emotions, such as hope, are contagious too'
};

data.parts.forEach((part) => {
  const ptext = part.passage_text || '';
  (part.questions || []).forEach((q) => {
    const t = byNum[q.number];
    if (!t) return;
    if (ptext.indexOf(t) === -1) {
      console.warn('Q' + q.number + ' highlight not found in passage:', t.slice(0, 50) + '...');
    }
    q.highlight_text = t;
  });
});

const q1 = data.parts[0].questions.find((q) => q.number === 1);
if (q1) {
  q1.explanation =
    "The passage states the kakapo is the world's only flightless parrot, so no other parrot shares that trait.";
}

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log('OK', jsonPath);
