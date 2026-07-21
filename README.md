# mask-directive

Workspace de desenvolvimento da biblioteca Angular **mask-directive** — máscaras de input, moedas ISO 4217 e pipe de formatação.

A documentação completa da lib (instalação, API e exemplos para todas as versões do Angular) está em [`projects/mask-directive/README.md`](projects/mask-directive/README.md).

## Versões publicadas no npm

| Tag npm | Angular alvo | Instalação |
|---|---|---|
| `angular-8` | 8.x | `npm install mask-directive@angular-8` |
| `angular-13` | 13.x | `npm install mask-directive@angular-13` |
| `latest` | 19+ | `npm install mask-directive@latest` |

## Desenvolvimento local

```bash
# instalar dependências (Angular 19 — ambiente padrão do workspace)
npm install

# build da biblioteca
npm run build

# playground de testes
npm run start
```

## Publicar no npm

```bash
./publish.sh
```

Requisitos:

- `jq` instalado
- `npm login` com a conta mantenedora do pacote
- Node 14 recomendado para publicar a tag `angular-8`

## Estrutura

```
projects/
  mask-directive/   # biblioteca publicada no npm
  testing2/         # app de testes (playground)
publish.sh          # script de publicação multi-versão
```
