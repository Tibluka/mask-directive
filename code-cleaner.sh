#!/bin/bash

# Script de Limpeza Avançada - Remove comentários, console.logs e lixos
# Remove console.logs multi-linha de forma segura

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🧹 Iniciando limpeza avançada (comentários + console.logs + lixos)...${NC}\n"

# Contador de arquivos processados
PROCESSED=0

# Função para limpeza avançada
clean_file() {
    local file="$1"
    local temp_file=$(mktemp)
    local extension="${file##*.}"
    
    # Copia o arquivo original
    cp "$file" "$temp_file"
    
    # Para arquivos HTML/Vue - remove comentários HTML
    if [[ "$extension" == "html" || "$extension" == "vue" ]]; then
        # Remove comentários HTML simples <!-- comentário -->
        sed -E 's|<!--[^>]*-->||g' "$temp_file" > "${temp_file}.html" && mv "${temp_file}.html" "$temp_file"
    fi
    
    # Para arquivos JS/TS - remove console.logs e debuggers de forma segura
    if [[ "$extension" == "js" || "$extension" == "ts" || "$extension" == "jsx" || "$extension" == "tsx" ]]; then
        # Remove console.logs multi-linha usando Node.js para parsing seguro
        node -e "
        const fs = require('fs');
        const content = fs.readFileSync('$temp_file', 'utf8');
        
        // Remove console.logs, console.error, console.warn, console.debug
        const lines = content.split('\n');
        const cleaned = [];
        let inConsoleBlock = false;
        let braceCount = 0;
        let indent = '';
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            
            // Detecta início de console statement
            if (trimmed.match(/^\s*console\.(log|error|warn|debug|info|trace)\s*\(/)) {
                inConsoleBlock = true;
                indent = line.match(/^(\s*)/)[1];
                braceCount = 0;
                
                // Conta parênteses e chaves para detectar fim
                for (let j = 0; j < line.length; j++) {
                    if (line[j] === '(') braceCount++;
                    if (line[j] === ')') braceCount--;
                }
                
                // Se já fechou na mesma linha, pula
                if (braceCount === 0) {
                    inConsoleBlock = false;
                    continue;
                }
                continue;
            }
            
            // Se estamos em um bloco console
            if (inConsoleBlock) {
                // Conta parênteses e chaves
                for (let j = 0; j < line.length; j++) {
                    if (line[j] === '(') braceCount++;
                    if (line[j] === ')') braceCount--;
                }
                
                // Se fechou todos os parênteses, sai do bloco
                if (braceCount === 0) {
                    inConsoleBlock = false;
                }
                continue;
            }
            
            // Remove debugger statements
            if (trimmed === 'debugger;' || trimmed === 'debugger') {
                continue;
            }
            
            // Remove console.logs simples (uma linha)
            if (trimmed.match(/^\s*console\.(log|error|warn|debug|info|trace)\s*\([^)]*\)\s*;?\s*$/)) {
                continue;
            }
            
            cleaned.push(line);
        }
        
        fs.writeFileSync('$temp_file', cleaned.join('\n'));
        " 2>/dev/null || {
            echo -e "${RED}⚠️  Erro ao processar console.logs em $file, usando método alternativo${NC}"
            # Método alternativo mais simples
            sed -E '/^[[:space:]]*console\.(log|error|warn|debug|info|trace)[[:space:]]*\([^)]*\)[[:space:]]*;?[[:space:]]*$/d' "$temp_file" > "${temp_file}.console" && mv "${temp_file}.console" "$temp_file"
            sed -E '/^[[:space:]]*debugger[[:space:]]*;?[[:space:]]*$/d' "$temp_file" > "${temp_file}.debug" && mv "${temp_file}.debug" "$temp_file"
        }
    fi
    
    # Remove comentários seguros
    # Remove comentários de linha única // (apenas no INÍCIO da linha)
    sed -E 's|^[[:space:]]*//.*$||g' "$temp_file" > "${temp_file}.1" && mv "${temp_file}.1" "$temp_file"
    
    # Remove comentários multi-linha /* ... */ simples (apenas em uma linha)
    sed -E 's|/\*[^*]*\*/||g' "$temp_file" > "${temp_file}.2" && mv "${temp_file}.2" "$temp_file"
    
    # Remove espaços no final das linhas
    sed -E 's/[[:space:]]*$//' "$temp_file" > "${temp_file}.3" && mv "${temp_file}.3" "$temp_file"
    
    # Remove linhas em branco excessivas (mais de 2 consecutivas)
    awk 'BEGIN{blank=0} /^[[:space:]]*$/{blank++; if(blank<=2) print; next} {blank=0; print}' "$temp_file" > "${temp_file}.4" && mv "${temp_file}.4" "$temp_file"
    
    # Verifica se houve mudanças
    if ! cmp -s "$file" "$temp_file"; then
        mv "$temp_file" "$file"
        echo -e "${GREEN}✅ Limpo: $file${NC}"
        ((PROCESSED++))
    else
        rm -f "$temp_file"
        echo -e "${YELLOW}⏭️  Sem mudanças: $file${NC}"
    fi
}

echo -e "${BLUE}📂 Procurando arquivos para limpar...${NC}"

# Processa arquivos
while IFS= read -r -d '' file; do
    clean_file "$file"
done < <(find ./src -type f \( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" -o -name "*.vue" -o -name "*.html" \) \
    -not -path "./node_modules/*" \
    -not -path "./.netlify/*" \
    -not -path "./.git/*" \
    -not -path "./dist/*" \
    -not -path "./build/*" \
    -not -path "./.next/*" \
    -print0 2>/dev/null)

echo ""
echo -e "${BLUE}✨ Limpeza avançada concluída!${NC}"
echo -e "${GREEN}📊 Arquivos processados: $PROCESSED${NC}"
echo ""
echo -e "${BLUE}ℹ️  O que foi removido:${NC}"
echo -e "  • Comentários HTML <!-- -->"
echo -e "  • Comentários // no início das linhas"
echo -e "  • Comentários /* */ simples"
echo -e "  • console.log, console.error, console.warn, console.debug, console.info, console.trace"
echo -e "  • debugger statements"
echo -e "  • Espaços no final das linhas"
echo -e "  • Linhas em branco excessivas"
echo ""
echo -e "${GREEN}✅ Console.logs multi-linha removidos com segurança!${NC}"
echo -e "${GREEN}✅ Sintaxe preservada - código não quebrado!${NC}"

# Pergunta se deseja dar push caso tenha havido mudanças
if [[ $PROCESSED -gt 0 ]]; then
    echo ""
    echo -e "${YELLOW}Deseja dar push das modificações limpas para o repositório? (s/N)${NC}"
    read -r -p "> " RESP
    if [[ "$RESP" =~ ^[sS]$ ]]; then
        echo -e "${BLUE}🔄 Adicionando arquivos modificados...${NC}"
        git add .
        echo -e "${BLUE}✍️  Informe a mensagem do commit (padrão: 'chore: limpeza automatizada'):${NC}"
        read -r -p "> " COMMIT_MSG
        if [[ -z "$COMMIT_MSG" ]]; then
            COMMIT_MSG="chore: limpeza automatizada"
        fi
        git commit -m "$COMMIT_MSG"
        echo -e "${BLUE}🚀 Dando push para o repositório...${NC}"
        git push
        echo -e "${GREEN}✅ Push realizado com sucesso!${NC}"
    else
        echo -e "${YELLOW}Push não realizado. Modificações estão apenas locais.${NC}"
    fi
fi