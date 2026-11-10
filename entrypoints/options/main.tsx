import { Hello } from '../../components/Hello';
import { NotesTab } from '../../components/notes/NotesTab';
import { mount } from '../../lib/mount';

mount(
  <>
    <Hello surface="options page" />
    <NotesTab />
  </>,
);
