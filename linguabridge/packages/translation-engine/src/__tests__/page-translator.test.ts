// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPageTranslator, translateEwondoSegment } from '../page-translator';

describe('offline page translation', () => {
  let translator: ReturnType<typeof createPageTranslator>;
  const report = vi.fn();

  beforeEach(() => {
    document.documentElement.lang = 'fr';
    document.body.innerHTML = '<h1>Bienvenue</h1><p>50 000 FCFA</p><form><label>Solde</label><input value="Solde"></form>';
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(new DOMRect(10, 10, 200, 35));
    report.mockClear();
    translator = createPageTranslator(report);
  });

  afterEach(() => {
    translator.destroy();
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it('uses whole phrases and leaves numbers or unknown sentences alone', () => {
    expect(translateEwondoSegment('Bienvenue !', 'fr')).toContain('Mbólo');
    expect(translateEwondoSegment('The interplanetary station is in orbit.', 'en')).toBeNull();
    expect(translateEwondoSegment('Solde 50 000 FCFA', 'fr')).toBeNull();
  });

  it('translates added content without replacing elements and restores the latest website text', async () => {
    const title = document.querySelector('h1')!;
    const node = title.firstChild!;
    translator.configure({ enabled: true, source: 'auto' });
    await vi.waitFor(() => expect(title.textContent).toBe('Mbólo'));
    expect(title.firstChild).toBe(node);
    expect(document.querySelector('form')?.textContent).toBe('Solde');
    expect(document.querySelector('p')?.textContent).toBe('50 000 FCFA');

    const added = document.createElement('h2');
    added.textContent = 'Bienvenue';
    document.body.append(added);
    await vi.waitFor(() => expect(added.textContent).toBe('Mbólo'));
    title.firstChild!.textContent = 'Solde';
    await vi.waitFor(() => expect(title.textContent).not.toBe('Solde'));
    translator.configure({ enabled: false, source: 'auto' });
    expect(title.textContent).toBe('Solde');
    expect(added.textContent).toBe('Bienvenue');
  });

  it('restores visible text when a password form appears', async () => {
    translator.configure({ enabled: true, source: 'auto' });
    await vi.waitFor(() => expect(document.querySelector('h1')?.textContent).toBe('Mbólo'));
    const input = document.createElement('input');
    input.type = 'password';
    document.body.append(input);
    await vi.waitFor(() => expect(report).toHaveBeenLastCalledWith('protected'));
    expect(document.querySelector('h1')?.textContent).toBe('Bienvenue');
  });

  it('switches the Android page target and restores the source text', async () => {
    const title = document.querySelector('h1')!;
    translator.configure({ enabled: true, source: 'auto', target: 'hau-CM' });
    await vi.waitFor(() => expect(title.textContent).toBe('Barka da zuwa'));
    translator.configure({ enabled: false, source: 'auto', target: 'hau-CM' });
    expect(title.textContent).toBe('Bienvenue');
  });

  it('fills unknown visible text from the cloud and restores it afterward', async () => {
    translator.destroy();
    document.body.innerHTML = '<p>La station interplanétaire est en orbite.</p><input value="Do not send me">';
    const remote = vi.fn(async (items: Array<{ text: string }>) => items.map(() => 'La station est en orbite.'));
    translator = createPageTranslator(report, remote);
    translator.configure({ enabled: true, source: 'fr', target: 'ewo-CM' });
    await vi.waitFor(() => expect(document.querySelector('p')?.textContent).toBe('La station est en orbite.'));
    expect(remote).toHaveBeenCalled();
    expect(remote.mock.calls.flatMap(([items]) => items.map((item) => item.text))).not.toContain('Do not send me');
    translator.configure({ enabled: false, source: 'fr', target: 'ewo-CM' });
    expect(document.querySelector('p')?.textContent).toBe('La station interplanétaire est en orbite.');
  });
});
