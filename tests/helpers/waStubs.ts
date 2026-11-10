class StubInput extends HTMLElement {
  value = '';
}

if (!customElements.get('wa-input')) customElements.define('wa-input', StubInput);
