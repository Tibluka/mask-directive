# mask-directive

Biblioteca Angular para aplicar máscaras em inputs e formatar valores via pipe.

Compatível com **Angular 8**, **Angular 13** e **Angular 19+**, publicada em tags separadas no npm.

## Instalação

Escolha a tag de acordo com a versão do Angular do seu projeto:

| Angular do projeto | Comando |
|---|---|
| 8.x | `npm install mask-directive@angular-8` |
| 13.x | `npm install mask-directive@angular-13` |
| 19+ | `npm install mask-directive@latest` |

## Importação

### Angular 8 e 13 (NgModule)

```typescript
import { MaskDirectiveModule } from 'mask-directive';

@NgModule({
  imports: [
    MaskDirectiveModule,
    FormsModule,        // necessário para ngModel
    ReactiveFormsModule // necessário para formControlName
  ]
})
export class AppModule {}
```

### Angular 19+ (standalone)

Importe o módulo (recomendado) ou os componentes avulsos:

```typescript
import { MaskDirectiveModule } from 'mask-directive';
// ou
import { MaskDirective, MaskPipe } from 'mask-directive';

@Component({
  standalone: true,
  imports: [MaskDirective, MaskPipe]
})
export class MeuComponente {}
```

## Recursos

### Máscaras de padrão

Use `libMask` no input. Caracteres especiais da máscara:

| Caractere | Aceita |
|---|---|
| `0` | Apenas números |
| `A` | Apenas letras |
| `*` | Letras e números |

Caracteres fixos (ponto, hífen, parênteses etc.) entram literalmente na máscara.

**Múltiplas máscaras:** separe com `||`. A lib escolhe automaticamente a que melhor se encaixa conforme a quantidade de caracteres digitados.

```html
<input libMask="(00) 0000-0000||(00) 00000-0000" [(ngModel)]="telefone">
```

### Reactive Forms e Template-driven

Funciona com `formControlName` e `[(ngModel)]` sem configuração extra. A diretiva injeta `NgControl` e `NgModel` como opcionais — não é necessário registrar `NgModel` manualmente no `providers`.

```html
<!-- Reactive -->
<input libMask="000.000.000-00" formControlName="cpf">

<!-- Template-driven -->
<input libMask="000.000.000-00" [(ngModel)]="cpf">
```

### `dropSpecialCharacters`

Controla o valor gravado no model / FormControl:

| Valor | Comportamento |
|---|---|
| `true` (padrão) | Armazena apenas caracteres alfanuméricos (sem pontuação) |
| `false` | Armazena o valor já formatado com a máscara |

```html
<input libMask="000.000.000-00" [dropSpecialCharacters]="false" [(ngModel)]="cpf">
<!-- model: "123.456.789-00" -->

<input libMask="000.000.000-00" [dropSpecialCharacters]="true" [(ngModel)]="cpf">
<!-- model: "12345678900" -->
```

### Máscaras de moeda (ISO 4217)

Passe o código da moeda diretamente em `libMask`. A formatação (símbolo, separadores e quantidade de decimais) é derivada em runtime via `Intl.NumberFormat` — **qualquer moeda ISO 4217 válida** no ambiente, sem lista fixa no código.

```html
<!-- Real -->
<input libMask="BRL" [(ngModel)]="valor">

<!-- Dólar com locale en-US ($1,234.56) -->
<input libMask="USD" [currencyLocale]="'en-US'" [(ngModel)]="valorUSD">

<!-- Iene (0 casas decimais) -->
<input libMask="JPY" [(ngModel)]="valorJPY">

<!-- Dinar kuwaitiano (3 casas decimais) -->
<input libMask="KWD" [(ngModel)]="valorKWD">
```

#### `currencyLocale`

Define o locale usado para derivar símbolo e separadores. Padrão: `pt-BR`.

```html
<input libMask="GBP" [currencyLocale]="'en-GB'" [(ngModel)]="valorGBP">
```

#### Armazenamento de moeda com `dropSpecialCharacters`

| `dropSpecialCharacters` | Valor no model |
|---|---|
| `true` | Valor no menor fracionamento da moeda (ex.: centavos para BRL) como string numérica |
| `false` | Valor formatado para exibição (ex.: `R$ 1.234,56`) |

### Validação automática

Ao usar `libMask`, a diretiva adiciona automaticamente um validator ao `FormControl` / `NgModel`. Quando o valor preenchido não corresponde ao padrão, o control fica inválido com o erro `maskPatternInvalid`.

Campos vazios não são invalidados (validators como `required` continuam responsáveis por isso).

### Validator manual (Angular 13+ e latest)

Disponível nas tags `angular-13` e `latest`:

```typescript
import { maskPatternValidator, createMaskValidator } from 'mask-directive';

this.form = this.fb.group({
  cpf: ['', [Validators.required, maskPatternValidator('000.000.000-00')]]
});
```

> Na tag `angular-8`, o validator manual não é exportado na public API (limitação do View Engine), mas a **validação automática via `libMask` funciona normalmente**.

### Pipe `libPipe`

Formata valores para exibição, com suporte a máscaras de padrão e moeda:

```html
<!-- Padrão -->
<span>{{ telefone | libPipe: '(00) 0000-0000||(00) 00000-0000' }}</span>

<!-- Moeda (locale opcional) -->
<span>{{ valorCentavos | libPipe: 'BRL' }}</span>
<span>{{ valorCentavos | libPipe: 'USD':'en-US' }}</span>
```

### Outros comportamentos

- **`valueChange`:** emite o valor processado (respeitando `dropSpecialCharacters`) a cada digitação.
- **`type="number"`:** a máscara é ignorada automaticamente nesses inputs.
- **Valor inicial / programático:** valores definidos via `patchValue`, `setValue` ou atribuição direta ao model são formatados no `ngOnInit`.
- **Moeda:** ao focar, o texto é selecionado; ao sair vazio, exibe o zero formatado da moeda.

## Exemplos

### CPF

```html
<input libMask="000.000.000-00" [(ngModel)]="cpf">
```

### CPF ou CNPJ dinâmico

```html
<input libMask="000.000.000-00||00.000.000/0000-00" [(ngModel)]="documento">
```

### Placa (letras + números)

```html
<input libMask="AAA-0000" [dropSpecialCharacters]="false" formControlName="placa">
```

### Placa Mercosul

```html
<input libMask="AAA0A00" [dropSpecialCharacters]="false" formControlName="placaMercosul">
```

### Código alfanumérico

```html
<input libMask="***-****" [(ngModel)]="codigo">
```

### Moeda em Reactive Form

```html
<form [formGroup]="form">
  <input libMask="BRL" formControlName="valor" [dropSpecialCharacters]="true">
</form>
```

```typescript
// valor no FormControl: "123456" (= R$ 1.234,56 em centavos)
this.form.get('valor').value;
```

### Emitir valor limpo manualmente

```html
<input
  libMask="000.000.000-00"
  [dropSpecialCharacters]="true"
  (valueChange)="cpf = $event">
```

## API exportada

| Export | Descrição |
|---|---|
| `MaskDirectiveModule` | Módulo com directive + pipe |
| `MaskDirective` | Diretiva `[libMask]` |
| `MaskPipe` | Pipe `libPipe` |
| `MaskDirectiveService` | Utilitários de moeda (`getCurrencyConfig`, `isValidCurrencyCode`) |
| `maskPatternValidator` | Validator manual *(angular-13 e latest)* |
| `createMaskValidator` | Alias do validator manual *(angular-13 e latest)* |
| `CurrencyMaskConfig` | Interface de configuração de moeda |

## Inputs da diretiva

| Input | Tipo | Padrão | Descrição |
|---|---|---|---|
| `libMask` | `string` | `''` | Padrão da máscara ou código ISO 4217 para moeda |
| `dropSpecialCharacters` | `boolean` | `true` | Remove pontuação do valor armazenado |
| `currencyLocale` | `string` | `'pt-BR'` | Locale para formatação de moeda |

## Outputs da diretiva

| Output | Tipo | Descrição |
|---|---|---|
| `valueChange` | `EventEmitter<string>` | Emite o valor processado a cada input |

## Publicação (desenvolvimento)

```bash
./publish.sh
```

O script publica no npm com a tag correspondente (`angular-8`, `angular-13` ou `latest`), incrementa a versão automaticamente e exige autenticação npm (`npm login`).

Para build/publicação do Angular 8, use Node 14 (`nvm use 14`).

## Licença

MIT
