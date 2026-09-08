const forbidden = [/\{\{/i, /\}\}/i, /item\.innerText/i, /undefined/i, /null/i];
const examples = [
  '{{ item.innerText }}',
  'be with an',
  'Step 2: Submit your application and pay the fee',
];
for (const value of examples) {
  if (!forbidden.some((re) => re.test(value)) && value.length > 8) {
    console.error('Unexpected unfiltered example:', value);
    process.exit(1);
  }
}
console.log('Immigration text smoke check passed');
