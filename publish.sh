#!/bin/bash

# Caminhos dos arquivos
PACKAGE_JSON_PATH="projects/mask-directive/package.json"
ROOT_PACKAGE_JSON_PATH="package.json"
DIRECTIVE_PATH="projects/mask-directive/src/lib/mask-directive.component.ts"
PIPE_PATH="projects/mask-directive/src/lib/mask.pipe.ts"
MODULE_PATH="projects/mask-directive/src/lib/mask-directive.module.ts"
PACKAGE_LOCK_PATH="package-lock.json"
TSCONFIG_PATH="tsconfig.json"
PUBLIC_API_PATH="projects/mask-directive/src/public-api.ts"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Mask Directive Publisher${NC}"
echo "=================================="

# Função para verificar se comando existe
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Usa o npm real, ignorando wrappers/aliases (ex: npm-smart-interceptor).
# Wrappers podem retornar exit 0 mesmo quando a versão não existe no registry.
run_npm() {
  command npm "$@"
}

# Verifica se uma versão específica já está publicada no NPM
is_version_published() {
  local package_name=$1
  local version=$2
  local published_version

  published_version=$(run_npm view "${package_name}@${version}" version 2>/dev/null | tr -d '[:space:]')
  [ "$published_version" = "$version" ]
}

# Verificar dependências necessárias
check_dependencies() {
  if ! command_exists jq; then
    echo -e "${RED}❌ jq não está instalado. Instale com: sudo apt-get install jq (Ubuntu) ou brew install jq (macOS)${NC}"
    exit 1
  fi
  
  if ! command_exists npm; then
    echo -e "${RED}❌ npm não está instalado${NC}"
    exit 1
  fi
}

# Verifica autenticação no NPM antes de alterar arquivos ou fazer build
check_npm_auth() {
  local npm_user

  npm_user=$(run_npm whoami 2>/dev/null | tr -d '[:space:]')

  if [ -z "$npm_user" ]; then
    echo -e "${RED}❌ Você não está autenticado no NPM (npm whoami falhou).${NC}"
    echo -e "${YELLOW}💡 O npm costuma retornar 404 no publish quando a sessão expirou.${NC}"
    echo -e "${YELLOW}💡 Faça login com a conta dona do pacote (lucasgomesagacode) e tente novamente:${NC}"
    echo -e "${YELLOW}   npm login${NC}"
    exit 1
  fi

  echo -e "${GREEN}✅ Autenticado no NPM como: $npm_user${NC}"
}

# Função para fazer backup de arquivos importantes
backup_files() {
  echo -e "${YELLOW}📋 Fazendo backup dos arquivos...${NC}"
  
  # Backup dos arquivos da biblioteca
  [ -f "$DIRECTIVE_PATH" ] && cp "$DIRECTIVE_PATH" "${DIRECTIVE_PATH}.backup"
  [ -f "$PIPE_PATH" ] && cp "$PIPE_PATH" "${PIPE_PATH}.backup"
  [ -f "$MODULE_PATH" ] && cp "$MODULE_PATH" "${MODULE_PATH}.backup"
  
  # Backup dos package.json
  [ -f "$ROOT_PACKAGE_JSON_PATH" ] && cp "$ROOT_PACKAGE_JSON_PATH" "${ROOT_PACKAGE_JSON_PATH}.backup"
  [ -f "$PACKAGE_JSON_PATH" ] && cp "$PACKAGE_JSON_PATH" "${PACKAGE_JSON_PATH}.backup"
  
  # Backup do package-lock.json
  [ -f "$PACKAGE_LOCK_PATH" ] && cp "$PACKAGE_LOCK_PATH" "${PACKAGE_LOCK_PATH}.backup"
  
  # Backup do tsconfig.json (raiz)
  [ -f "$TSCONFIG_PATH" ] && cp "$TSCONFIG_PATH" "${TSCONFIG_PATH}.backup"
  
  # Backup do public-api.ts
  [ -f "$PUBLIC_API_PATH" ] && cp "$PUBLIC_API_PATH" "${PUBLIC_API_PATH}.backup"
  
  echo -e "${GREEN}✅ Backup concluído${NC}"
}

# Função para restaurar arquivos
restore_files() {
  echo -e "${YELLOW}🔄 Restaurando arquivos originais...${NC}"
  
  # Restaurar arquivos da biblioteca
  [ -f "${DIRECTIVE_PATH}.backup" ] && mv "${DIRECTIVE_PATH}.backup" "$DIRECTIVE_PATH"
  [ -f "${PIPE_PATH}.backup" ] && mv "${PIPE_PATH}.backup" "$PIPE_PATH"
  [ -f "${MODULE_PATH}.backup" ] && mv "${MODULE_PATH}.backup" "$MODULE_PATH"
  
  # Restaurar package.json
  [ -f "${ROOT_PACKAGE_JSON_PATH}.backup" ] && mv "${ROOT_PACKAGE_JSON_PATH}.backup" "$ROOT_PACKAGE_JSON_PATH"
  [ -f "${PACKAGE_JSON_PATH}.backup" ] && mv "${PACKAGE_JSON_PATH}.backup" "$PACKAGE_JSON_PATH"
  
  # Restaurar package-lock.json
  [ -f "${PACKAGE_LOCK_PATH}.backup" ] && mv "${PACKAGE_LOCK_PATH}.backup" "$PACKAGE_LOCK_PATH"
  
  # Restaurar tsconfig.json (raiz)
  [ -f "${TSCONFIG_PATH}.backup" ] && mv "${TSCONFIG_PATH}.backup" "$TSCONFIG_PATH"
  
  # Restaurar public-api.ts
  [ -f "${PUBLIC_API_PATH}.backup" ] && mv "${PUBLIC_API_PATH}.backup" "$PUBLIC_API_PATH"
  
  echo -e "${GREEN}✅ Arquivos restaurados${NC}"
}

# Função para obter a próxima versão disponível do NPM
get_next_available_version() {
  local current_version=$1
  local package_name="mask-directive"
  
  echo -e "${YELLOW}🔍 Verificando versões publicadas no NPM...${NC}" >&2
  
  local latest_published
  latest_published=$(run_npm view "$package_name" version 2>/dev/null | tr -d '[:space:]')
  
  if [ -z "$latest_published" ]; then
    echo -e "${YELLOW}⚠️  Não foi possível obter versões do NPM. Usando versão local: $current_version${NC}" >&2
    echo "$current_version"
    return
  fi
  
  echo -e "${BLUE}📋 Última versão no NPM: $latest_published${NC}" >&2
  
  # Parse da versão local e da última publicada (major.minor.patch)
  IFS='.' read -r local_major local_minor local_patch <<< "$current_version"
  IFS='.' read -r latest_major latest_minor latest_patch <<< "$latest_published"
  
  local major=$local_major
  local minor=$local_minor
  local patch=$local_patch
  
  # Começa do maior patch entre local e NPM (mesmo major.minor)
  if [ "$latest_major" = "$local_major" ] && [ "$latest_minor" = "$local_minor" ]; then
    if [ "$latest_patch" -gt "$patch" ]; then
      patch=$latest_patch
    fi
  elif [ "$latest_major" -gt "$local_major" ] 2>/dev/null || \
       { [ "$latest_major" = "$local_major" ] && [ "$latest_minor" -gt "$local_minor" ] 2>/dev/null; }; then
    major=$latest_major
    minor=$latest_minor
    patch=$latest_patch
  fi
  
  # Incrementar patch até encontrar versão não publicada
  local test_version
  local max_attempts=100
  local attempts=0
  
  while [ $attempts -lt $max_attempts ]; do
    patch=$((patch + 1))
    test_version="$major.$minor.$patch"
    
    if is_version_published "$package_name" "$test_version"; then
      echo -e "${YELLOW}⚠️  Versão $test_version já existe no NPM${NC}" >&2
      attempts=$((attempts + 1))
    else
      echo -e "${GREEN}✅ Próxima versão disponível: $test_version${NC}" >&2
      echo "$test_version"
      return
    fi
  done
  
  echo -e "${RED}❌ Não foi possível encontrar uma versão disponível após $max_attempts tentativas${NC}" >&2
  exit 1
}

# Função para atualizar workspace para Angular 13
setup_angular_13_workspace() {
  echo -e "${YELLOW}⚙️  Configurando workspace para Angular 13...${NC}"
  
  # Dependências Angular 13
  cat > temp_package.json << 'EOF'
{
  "name": "mask-directive",
  "version": "0.2.25",
  "scripts": {
    "ng": "ng",
    "start": "ng serve testing2",
    "build": "ng build mask-directive",
    "watch": "ng build mask-directive --watch --configuration development",
    "publish-npm": "./publish.sh",
    "test": "ng test"
  },
  "private": true,
  "dependencies": {
    "@angular/animations": "~13.1.0",
    "@angular/common": "~13.1.0",
    "@angular/compiler": "~13.1.0",
    "@angular/core": "~13.1.0",
    "@angular/forms": "~13.1.0",
    "@angular/platform-browser": "~13.1.0",
    "@angular/platform-browser-dynamic": "~13.1.0",
    "@angular/router": "~13.1.0",
    "rxjs": "~7.4.0",
    "tslib": "^2.3.0",
    "zone.js": "~0.11.4"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "~13.1.4",
    "@angular/cli": "~13.1.2",
    "@angular/compiler-cli": "~13.1.0",
    "@types/jasmine": "~3.10.0",
    "@types/node": "^12.11.1",
    "jasmine-core": "~3.10.0",
    "karma": "~6.3.0",
    "karma-chrome-launcher": "~3.1.0",
    "karma-coverage": "~2.1.0",
    "karma-jasmine": "~4.0.0",
    "karma-jasmine-html-reporter": "~1.7.0",
    "ng-packagr": "^13.0.0",
    "typescript": "~4.5.2"
  },
  "peerDependencies": {
    "@angular/common": "^13.1.0",
    "@angular/core": "^13.1.0"
  }
}
EOF
  
  # Mover para package.json principal
  mv temp_package.json "$ROOT_PACKAGE_JSON_PATH"
}

# Função para atualizar workspace para Angular 19
setup_angular_19_workspace() {
  echo -e "${YELLOW}⚙️  Configurando workspace para Angular 19...${NC}"
  
  # Dependências Angular 19
  cat > temp_package.json << 'EOF'
{
  "name": "mask-directive",
  "version": "0.2.25",
  "scripts": {
    "ng": "ng",
    "start": "ng serve testing2",
    "build": "ng build mask-directive",
    "watch": "ng build mask-directive --watch --configuration development",
    "publish-npm": "./publish.sh",
    "test": "ng test"
  },
  "private": true,
  "dependencies": {
    "@angular/animations": "^19.0.0",
    "@angular/common": "^19.0.0",
    "@angular/compiler": "^19.0.0",
    "@angular/core": "^19.0.0",
    "@angular/forms": "^19.0.0",
    "@angular/platform-browser": "^19.0.0",
    "@angular/platform-browser-dynamic": "^19.0.0",
    "@angular/router": "^19.0.0",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0",
    "zone.js": "~0.15.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^19.0.0",
    "@angular/cli": "^19.0.0",
    "@angular/compiler-cli": "^19.0.0",
    "@types/jasmine": "~5.1.0",
    "@types/node": "^18.18.0",
    "jasmine-core": "~5.4.0",
    "karma": "~6.4.0",
    "karma-chrome-launcher": "~3.2.0",
    "karma-coverage": "~2.2.0",
    "karma-jasmine": "~5.1.0",
    "karma-jasmine-html-reporter": "~2.1.0",
    "ng-packagr": "^19.0.0",
    "typescript": "~5.6.2"
  },
  "peerDependencies": {
    "@angular/common": "^19.0.0",
    "@angular/core": "^19.0.0"
  }
}
EOF
  
  # Mover para package.json principal
  mv temp_package.json "$ROOT_PACKAGE_JSON_PATH"
}

# Função para atualizar workspace para Angular 8
setup_angular_8_workspace() {
  echo -e "${YELLOW}⚙️  Configurando workspace para Angular 8...${NC}"
  
  # Dependências Angular 8 (View Engine, TypeScript ~3.5, RxJS 6)
  # O builder "@angular-devkit/build-angular:ng-packagr" não existe no Angular 8,
  # então o build da lib usa o ng-packagr diretamente, com o tsconfig ajustado
  # para TypeScript ~3.5 (ver setup_angular_8_tsconfig).
  cat > temp_package.json << 'EOF'
{
  "name": "mask-directive",
  "version": "0.2.25",
  "scripts": {
    "ng": "ng",
    "start": "ng serve testing2",
    "build": "ng-packagr -p projects/mask-directive/ng-package.json -c tsconfig.json",
    "watch": "ng-packagr -p projects/mask-directive/ng-package.json -c tsconfig.json --watch",
    "publish-npm": "./publish.sh",
    "test": "ng test"
  },
  "private": true,
  "dependencies": {
    "@angular/animations": "~8.2.14",
    "@angular/common": "~8.2.14",
    "@angular/compiler": "~8.2.14",
    "@angular/core": "~8.2.14",
    "@angular/forms": "~8.2.14",
    "@angular/platform-browser": "~8.2.14",
    "@angular/platform-browser-dynamic": "~8.2.14",
    "@angular/router": "~8.2.14",
    "rxjs": "~6.4.0",
    "tslib": "^1.10.0",
    "zone.js": "~0.9.1"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "~0.803.29",
    "@angular/cli": "~8.3.29",
    "@angular/compiler-cli": "~8.2.14",
    "@types/jasmine": "~3.3.8",
    "@types/node": "~8.9.4",
    "jasmine-core": "~3.4.0",
    "karma": "~4.1.0",
    "karma-chrome-launcher": "~2.2.0",
    "karma-coverage": "~1.1.2",
    "karma-jasmine": "~2.0.1",
    "karma-jasmine-html-reporter": "~1.4.2",
    "ng-packagr": "~5.7.1",
    "typescript": "~3.5.3"
  },
  "peerDependencies": {
    "@angular/common": "^8.0.0",
    "@angular/core": "^8.0.0"
  }
}
EOF
  
  # Mover para package.json principal
  mv temp_package.json "$ROOT_PACKAGE_JSON_PATH"
}

# Função para gerar um tsconfig.json compatível com TypeScript ~3.5 (Angular 8)
# O tsconfig padrão do workspace usa opções (module: es2020, noPropertyAccessFromIndexSignature,
# noImplicitOverride) que só existem em versões do TypeScript muito mais novas que a exigida
# pelo Angular 8, então precisamos de uma versão reduzida só para esse build.
setup_angular_8_tsconfig() {
  echo -e "${YELLOW}⚙️  Configurando tsconfig.json compatível com TypeScript ~3.5...${NC}"
  
  cat > "$TSCONFIG_PATH" << 'EOF'
{
  "compileOnSave": false,
  "compilerOptions": {
    "baseUrl": "./",
    "outDir": "./dist/out-tsc",
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "sourceMap": true,
    "declaration": false,
    "downlevelIteration": true,
    "experimentalDecorators": true,
    "moduleResolution": "node",
    "importHelpers": true,
    "target": "es2015",
    "module": "es2015",
    "types": [],
    "lib": [
      "es2017",
      "dom"
    ]
  },
  "angularCompilerOptions": {
    "fullTemplateTypeCheck": true,
    "strictInjectionParameters": true
  }
}
EOF

  echo -e "${GREEN}✅ tsconfig.json ajustado para Angular 8${NC}"
}

# Função para adicionar standalone: true (apenas se não existir)
add_standalone() {
  local file_path=$1
  local decorator_type=$2
  
  # Verificar se standalone já existe
  if grep -q "standalone:" "$file_path"; then
    echo -e "${YELLOW}⚠️  standalone já existe em $file_path - pulando...${NC}"
    return
  fi
  
  if [ "$decorator_type" == "directive" ]; then
    sed -i.tmp 's/@Directive({/@Directive({\n  standalone: true,/' "$file_path"
  elif [ "$decorator_type" == "pipe" ]; then
    sed -i.tmp 's/@Pipe({/@Pipe({\n  standalone: true,/' "$file_path"
  fi
  
  rm -f "${file_path}.tmp"
  echo -e "${GREEN}✅ Adicionado standalone: true em $file_path${NC}"
}

# Função para criar módulo standalone
create_standalone_module() {
  echo -e "${YELLOW}⚙️  Criando módulo para componentes standalone...${NC}"
  
  cat > "$MODULE_PATH" << 'EOF'
import { NgModule } from '@angular/core';
import { MaskDirective } from './mask-directive.component';
import { MaskPipe } from './mask.pipe';

@NgModule({
  imports: [
    MaskDirective,
    MaskPipe
  ],
  exports: [
    MaskDirective,
    MaskPipe
  ]
})
export class MaskDirectiveModule { }
EOF

  echo -e "${GREEN}✅ Módulo standalone criado${NC}"
}

# Função para remover standalone: true (para Angular < 14, que não suporta essa propriedade)
remove_standalone() {
  local file_path=$1
  
  if ! grep -q "standalone:" "$file_path"; then
    echo -e "${YELLOW}⚠️  standalone não existe em $file_path - pulando...${NC}"
    return
  fi
  
  # Remove a linha "standalone: true" (com ou sem vírgula). A vírgula sobrando
  # após a propriedade anterior (ex: selector) é válida em objetos JS/TS,
  # então não precisa ser removida.
  sed -i.tmp -E '/^[[:space:]]*standalone:[[:space:]]*true,?[[:space:]]*$/d' "$file_path"
  
  rm -f "${file_path}.tmp"
  echo -e "${GREEN}✅ Removido standalone: true de $file_path${NC}"
}

# Função para criar módulo com declarations (para componentes não-standalone)
create_declarations_module() {
  echo -e "${YELLOW}⚙️  Criando módulo com declarations para componentes não-standalone...${NC}"
  
  cat > "$MODULE_PATH" << 'EOF'
import { NgModule } from '@angular/core';
import { MaskDirective } from './mask-directive.component';
import { MaskPipe } from './mask.pipe';

@NgModule({
  declarations: [
    MaskDirective,
    MaskPipe
  ],
  exports: [
    MaskDirective,
    MaskPipe
  ]
})
export class MaskDirectiveModule { }
EOF

  echo -e "${GREEN}✅ Módulo com declarations criado${NC}"
}

# View Engine (Angular 8) não consegue serializar factory functions que retornam
# lambdas no metadata quando exportadas pela public API. A validação automática
# via libMask continua funcionando; apenas o import manual do validator é omitido
# na versão angular-8.
remove_validator_public_export() {
  echo -e "${YELLOW}⚙️  Removendo export do validator da public API (compatibilidade Angular 8)...${NC}"
  
  sed -i.tmp "/mask-pattern.validator/d" "$PUBLIC_API_PATH"
  rm -f "${PUBLIC_API_PATH}.tmp"
  
  echo -e "${GREEN}✅ Export do validator removido da public API${NC}"
}

# Função para atualizar versão
update_version() {
  local package_json_path=$1
  local new_version=$2
  local peer_dependencies=$3

  jq --arg version "$new_version" --argjson peerDeps "$peer_dependencies" \
    '.version = $version | .peerDependencies = $peerDeps' \
    "$package_json_path" > temp.json && mv temp.json "$package_json_path"

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Versão $new_version atualizada em $package_json_path${NC}"
  else
    echo -e "${RED}❌ Falha ao atualizar versão em $package_json_path${NC}"
    exit 1
  fi
}

# Função para reinstalar dependências
reinstall_dependencies() {
  echo -e "${YELLOW}📦 Reinstalando dependências...${NC}"
  
  # Remover node_modules e package-lock.json para instalação limpa
  rm -rf node_modules
  rm -f package-lock.json
  
  # Instalar dependências
  echo -e "${BLUE}🔄 Executando npm install...${NC}"
  run_npm install || {
    echo -e "${YELLOW}⚠️  npm install falhou. Tentando com --legacy-peer-deps...${NC}"
    run_npm install --legacy-peer-deps || {
      echo -e "${RED}❌ Falha ao instalar dependências${NC}"
      restore_files
      exit 1
    }
  }
  
  echo -e "${GREEN}✅ Dependências instaladas com sucesso${NC}"
}

# Trap para restaurar arquivos em caso de erro
trap restore_files EXIT

# Verificar dependências
check_dependencies
check_npm_auth

# Verificações iniciais
if [ ! -f "$PACKAGE_JSON_PATH" ]; then
  echo -e "${RED}❌ Arquivo $PACKAGE_JSON_PATH não encontrado!${NC}"
  exit 1
fi

# Backup inicial
backup_files

# Obter versão atual
CURRENT_VERSION=$(jq -r '.version' "$PACKAGE_JSON_PATH")
if [ -z "$CURRENT_VERSION" ]; then
  echo -e "${RED}❌ Não foi possível encontrar a versão no $PACKAGE_JSON_PATH${NC}"
  exit 1
fi

echo -e "${BLUE}📋 Versão atual no package.json: $CURRENT_VERSION${NC}"

# Obter próxima versão disponível
echo -e "${BLUE}📋 Obtendo próxima versão disponível...${NC}"
NEW_VERSION=$(get_next_available_version "$CURRENT_VERSION")

# Verificar se a versão foi obtida corretamente
if [ -z "$NEW_VERSION" ] || [[ "$NEW_VERSION" =~ [^0-9\.] ]]; then
  echo -e "${RED}❌ Erro ao obter nova versão. Versão obtida: '$NEW_VERSION'${NC}"
  exit 1
fi

echo -e "${BLUE}📋 Nova versão a ser publicada: $NEW_VERSION${NC}"
echo ""

# Escolher versão de publicação
echo -e "${YELLOW}Escolha a versão para publicação:${NC}"
echo "1) angular-8 (para projetos Angular 8)"
echo "2) angular-13 (para projetos Angular 13)"
echo "3) latest (para projetos Angular 19+)"
echo ""
read -p "Digite sua escolha (1, 2 ou 3): " choice

case $choice in
  1)
    version_type="angular-8"
    PEER_DEPENDENCIES='{"@angular/common": "^8.0.0", "@angular/core": "^8.0.0"}'
    
    echo -e "${BLUE}🎯 Configurando para Angular 8 (View Engine, sem standalone)${NC}"
    setup_angular_8_workspace
    setup_angular_8_tsconfig
    
    # Angular 8 não suporta standalone (introduzido no Angular 14)
    remove_standalone "$DIRECTIVE_PATH"
    remove_standalone "$PIPE_PATH"
    create_declarations_module
    remove_validator_public_export
    
    reinstall_dependencies
    ;;
  2)
    version_type="angular-13"
    PEER_DEPENDENCIES='{"@angular/common": "^13.1.0", "@angular/core": "^13.1.0"}'
    
    echo -e "${BLUE}🎯 Configurando para Angular 13 (sem standalone)${NC}"
    setup_angular_13_workspace
    
    # Angular 13 não suporta standalone (introduzido no Angular 14)
    remove_standalone "$DIRECTIVE_PATH"
    remove_standalone "$PIPE_PATH"
    create_declarations_module
    
    reinstall_dependencies
    ;;
  3)
    version_type="latest"
    PEER_DEPENDENCIES='{"@angular/common": "^19.0.0", "@angular/core": "^19.0.0"}'
    
    echo -e "${BLUE}🎯 Configurando para Angular 19+ (com standalone)${NC}"
    setup_angular_19_workspace
    reinstall_dependencies
    
    # Adicionar standalone para versão latest
    add_standalone "$DIRECTIVE_PATH" "directive"
    add_standalone "$PIPE_PATH" "pipe"
    
    # Criar módulo que importa componentes standalone
    create_standalone_module
    ;;
  *)
    echo -e "${RED}❌ Opção inválida! Use 1, 2 ou 3.${NC}"
    exit 1
    ;;
esac

# Atualizar versões nos package.json da biblioteca
update_version "$PACKAGE_JSON_PATH" "$NEW_VERSION" "$PEER_DEPENDENCIES"

# Build da biblioteca
echo -e "${BLUE}🔨 Fazendo build da biblioteca...${NC}"
run_npm run build || {
  echo -e "${RED}❌ Falha na build${NC}"
  restore_files
  exit 1
}

# Verificar se dist foi gerado
if [ ! -d "dist/mask-directive" ]; then
  echo -e "${RED}❌ Diretório dist/mask-directive não encontrado após build!${NC}"
  restore_files
  exit 1
fi

# Publicar no NPM
cd dist/mask-directive || {
  restore_files
  exit 1
}

echo -e "${BLUE}📦 Publicando no NPM com tag $version_type...${NC}"
echo -e "${YELLOW}Versão a ser publicada: $NEW_VERSION${NC}"

# Verificar se versão já existe antes de publicar (confere o valor retornado, não só exit code)
if is_version_published "mask-directive" "$NEW_VERSION"; then
  echo -e "${RED}❌ Versão $NEW_VERSION já existe no NPM!${NC}"
  echo -e "${YELLOW}💡 Rode ./publish.sh novamente para obter a próxima versão disponível.${NC}"
  cd ../..
  restore_files
  exit 1
fi

run_npm publish --tag "$version_type" || {
  echo -e "${RED}❌ Falha ao publicar${NC}"
  cd ../..
  restore_files
  exit 1
}

echo -e "${GREEN}🎉 Library mask-directive@$NEW_VERSION publicada com sucesso!${NC}"
echo -e "${GREEN}📦 Tag: $version_type${NC}"

# Voltar para diretório raiz
cd ../..

# Restaurar arquivos originais
restore_files

echo ""
echo -e "${GREEN}✅ Processo concluído com sucesso!${NC}"
echo -e "${BLUE}📋 Para instalar:${NC}"
if [ "$version_type" == "angular-8" ]; then
  echo -e "${YELLOW}   npm install mask-directive@angular-8${NC}"
elif [ "$version_type" == "angular-13" ]; then
  echo -e "${YELLOW}   npm install mask-directive@angular-13${NC}"
else
  echo -e "${YELLOW}   npm install mask-directive@latest${NC}"
fi

# Limpar trap
trap - EXIT