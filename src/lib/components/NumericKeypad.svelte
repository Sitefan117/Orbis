<script lang="ts">
  /**
   * Pavé numérique tactile partagé par les exercices à réponse chiffrée.
   * La valeur reste liée au champ parent avec bind:value, donc le clavier
   * fonctionne aussi avec le clavier physique et avec VoiceOver.
   */
  export let value = '';
  export let disabled = false;
  export let allowDecimal = true;
  export let allowNegative = false;
  export let onSubmit: (() => void) | undefined;

  function append(key: string) {
    if (disabled) return;
    if (key === ',' || key === '.') {
      if (!allowDecimal || /[,.]/.test(value)) return;
      value += key;
      return;
    }
    if (key === '-' && (!allowNegative || value.length > 0)) return;
    value += key;
  }

  function erase() {
    if (!disabled) value = value.slice(0, -1);
  }

  function clear() {
    if (!disabled) value = '';
  }

  function submit() {
    if (!disabled) onSubmit?.();
  }
</script>

<div class="numeric-keypad" aria-label="Pavé numérique tactile">
  {#each ['7', '8', '9', '4', '5', '6', '1', '2', '3'] as key}
    <button type="button" disabled={disabled} on:click={() => append(key)}>{key}</button>
  {/each}
  <button type="button" class="key-secondary" disabled={disabled} on:click={clear}>C</button>
  <button type="button" disabled={disabled} on:click={() => append('0')}>0</button>
  <button type="button" class="key-secondary" aria-label="Effacer le dernier chiffre" disabled={disabled} on:click={erase}>⌫</button>
  {#if allowDecimal}
    <button type="button" class="key-secondary" disabled={disabled} on:click={() => append(',')}>,</button>
  {/if}
  {#if allowNegative}
    <button type="button" class="key-secondary" disabled={disabled} on:click={() => append('-')}>−</button>
  {/if}
  <button type="button" class="key-submit" disabled={disabled || value.trim() === ''} on:click={submit}>Valider</button>
</div>

<style>
  .numeric-keypad { display: grid; grid-template-columns: repeat(3, minmax(3.5rem, 5.5rem)); gap: .45rem; width: min(100%, 20rem); margin: .7rem auto 0; justify-content: center; }
  .numeric-keypad button { min-height: 3rem; border: 1px solid rgb(148 163 184 / 45%); border-radius: .7rem; background: rgb(15 23 42 / 92%); color: #f8fafc; font: 800 1.15rem/1 ui-monospace, monospace; touch-action: manipulation; }
  .numeric-keypad button:active { transform: translateY(1px); background: #2563eb; }
  .numeric-keypad button:disabled { opacity: .45; }
  .numeric-keypad .key-secondary { color: #bae6fd; background: rgb(14 116 144 / 35%); }
  .numeric-keypad .key-submit { grid-column: 1 / -1; background: linear-gradient(135deg, #0ea5e9, #2563eb); color: white; }
  @media (min-width: 700px) and (pointer: fine) { .numeric-keypad { max-width: 16rem; } }
</style>
