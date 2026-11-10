import { generateIcons } from './icons';

generateIcons('assets/icon.svg', 'public/icon').forEach((file) => console.log(file));
