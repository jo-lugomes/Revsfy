#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "sqlite3.h"

// Função auxiliar para extrair valores de um JSON simples (string bruta)
// Procura por "chave":"valor" e copia o valor para o buffer destino
void extrair_valor_json(const char *json, const char *chave, char *destino, int tamanho_max) {
    char busca[100];
    // Monta a string de busca ex: "nome":"
    sprintf(busca, "\"%s\":\"", chave);

    char *inicio = strstr(json, busca);
    if (inicio) {
        // Pula a chave e os caracteres separadores ("nome":")
        inicio += strlen(busca);
        
        int i = 0;
        // Copia até encontrar a aspa de fechamento ou atingir o limite
        while (inicio[i] != '\"' && inicio[i] != '\0' && i < tamanho_max - 1) {
            destino[i] = inicio[i];
            i++;
        }
        destino[i] = '\0'; // Finaliza a string
    } else {
        strcpy(destino, ""); // Não encontrou
    }
}

int main(int argc, char *argv[]) {
    // 1. Verifica se o Node enviou os caminhos dos arquivos
    if (argc < 3) {
        fprintf(stderr, "Uso incorreto via linha de comando.\nUse: programa.exe <caminho_json> <caminho_banco>\n");
        return 1;
    }

    char *caminho_json = argv[1];
    char *caminho_banco = argv[2];

    printf("Iniciando integracao C...\n");
    printf("Lendo JSON: %s\n", caminho_json);
    printf("Banco Alvo: %s\n", caminho_banco);

    // 2. Lê o arquivo JSON gerado pelo Node
    FILE *arquivo = fopen(caminho_json, "rb");
    if (!arquivo) {
        fprintf(stderr, "Erro ao abrir o arquivo JSON.\n");
        return 1;
    }

    // Descobre o tamanho do arquivo para alocar memória
    fseek(arquivo, 0, SEEK_END);
    long tamanho_arquivo = ftell(arquivo);
    fseek(arquivo, 0, SEEK_SET);

    char *conteudo_json = (char *)malloc(tamanho_arquivo + 1);
    if (!conteudo_json) {
        fclose(arquivo);
        fprintf(stderr, "Erro de memoria.\n");
        return 1;
    }

    fread(conteudo_json, 1, tamanho_arquivo, arquivo);
    conteudo_json[tamanho_arquivo] = '\0'; // Garante o fim da string
    fclose(arquivo);

    // 3. Extrai os dados do JSON (Parsing Manual)
    char nome[200];
    char url[500];

    extrair_valor_json(conteudo_json, "nome", nome, sizeof(nome));
    extrair_valor_json(conteudo_json, "imagem_url", url, sizeof(url));
    
    // Libera a memória do texto bruto do arquivo
    free(conteudo_json);

    if (strlen(nome) == 0 || strlen(url) == 0) {
        fprintf(stderr, "Erro: JSON vazio ou formato invalido.\n");
        return 1;
    }

    printf("Dados extraidos -> Nome: %s | URL: ... (ok)\n", nome);

    // 4. Conecta ao SQLite
    sqlite3 *db;
    sqlite3_stmt *stmt;
    int rc;

    rc = sqlite3_open(caminho_banco, &db);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "Erro ao abrir banco: %s\n", sqlite3_errmsg(db));
        return 1;
    }

    // 5. Gera o novo ID (Logica original mantida)
    char *sql_check = "SELECT MAX(appid) FROM jogos;";
    rc = sqlite3_prepare_v2(db, sql_check, -1, &stmt, 0);

    int novo_id = 4144831; // Valor padrao caso banco vazio
    if (rc == SQLITE_OK) {
        if (sqlite3_step(stmt) == SQLITE_ROW) {
            int id_atual = sqlite3_column_int(stmt, 0);
            if (id_atual > 0) novo_id = id_atual + 1;
        }
    }
    sqlite3_finalize(stmt);

    printf("Gerando ID: %d\n", novo_id);

    // 6. Insere no Banco
    char *sql_insert = "INSERT INTO jogos (appid, nome, imagem_url, tipo) VALUES (?, ?, ?, 'custom');";
    rc = sqlite3_prepare_v2(db, sql_insert, -1, &stmt, 0);

    if (rc != SQLITE_OK) {
        fprintf(stderr, "Erro ao preparar INSERT: %s\n", sqlite3_errmsg(db));
        sqlite3_close(db);
        return 1;
    }

    // Bind dos valores (evita SQL Injection)
    sqlite3_bind_int(stmt, 1, novo_id);
    sqlite3_bind_text(stmt, 2, nome, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 3, url, -1, SQLITE_STATIC);

    if (sqlite3_step(stmt) == SQLITE_DONE) {
        printf("SUCESSO: Jogo inserido no banco.\n");
    } else {
        fprintf(stderr, "FALHA ao inserir: %s\n", sqlite3_errmsg(db));
        sqlite3_finalize(stmt);
        sqlite3_close(db);
        return 1;
    }

    sqlite3_finalize(stmt);
    sqlite3_close(db);
    
    return 0;
}