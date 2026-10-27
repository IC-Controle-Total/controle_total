// Additional vocabulary extracted from the project's Portuguese board labels.
import portugueseWords from './portugueseWords.json';

// Offline vocabulary, supplemented by words from the user's saved phrases.
const words = `
acabou agora agradecer ajuda ajudar alegre alimento almoçar almoço amanhã amigo amiga
amigos amor andar antes aqui arroz assim até aula água banheiro banho bastante beber
bem boa boas boca bola bolo bom bonita bonito noite brincar buscar café calor cama
caminhar caminho cansada cansado cantar casa casaco cedo celular certo chamar
chocolate chuva cidade cinema com comer comida como comprar computador conhecer
conseguir conversar copo coração correr coisa coisas cozinha criança cuidado cuidar
cadeira cachorro cabelo cabeça cadê calma calça camisa carinho carro carta casamento
caderno cansaço carne castelo casal casinha castanha comigo compartilhar compreender
completo completar compromisso conversa conta contar continuar contente consigo
construir confortável consulta controle consertar convidar convite companheiro
contato conhecimento compra começar começo comendo comeu comemos comi come cozinhar
corpo cor cores correto colher colocar colégio colega cobertor criar crescer creme
cruzar chegar cheiro cheio chave chá chorar copos copiar corda corrida cortar corte
curto curta coelho cobra coco cola colar coleção colete colina colisão colheita cada
cafeteira caixa cair caju caminhada campainha campo caneta caneca canto capacidade
capacete capim capricho carregar carteira cartão castigo causa cavalo cebola cenoura
centro cereal cerveja cesta chão chinelo cicatriz cima cinco cinto circular circo
claro classe clube cobrir cobrar cócegas código colorido combinar concordar condição
confiança confiar confuso congelado concha conexão conselho conservar considerar
contrário conviver coragem cordão corredor costurar costume cotovelo crer crise
curioso curva custo céu círculo cílios calendário coberta cobertura cobrado cobrança
cobri cobre comidas comido comidos comeremos comeram comerá comerão comprei comprou
comprando compras comprador compramos compraremos comunicar comunicação comunidade
companhia comparação comparar computadores complicado complicar compor comportamento
comprido comprimento compreensão compreendido continuando continua continuou contagem
contigo contas contei contou contamos contador conheço conheci conheceu conhecemos
conhecida conhecido conversando conversas conversamos conversei conforto confirma
confirmar confesso consegue conseguimos conseguem conseguiu convidado convidada
convidados convites completamente completa completou comportar compartilhando
compartilhado conectar conectado conexões contatos cozinheiro cozinheira cozido
cozinhei cuidados cuidadoso cuidadora cuidador cuidando colegas colares colecionar
comércio comercial comerciante comum comuns comemorar comemoração comemorando
companheira conversou conversaram conversarei conversaremos dar de descansar desculpa
desculpe depois devagar dia diferente difícil dizer dois dor dormir doce domingo
dinheiro documento doente doutor eu ela ele eles elas escola escrever escutar esperar
espaço estou estar está estamos estão era esse essa este esta entender entrar
encontrar família falar fazer feliz fechar feijão festa filho filha fome fora frio
fruta foi fomos futebol gosto gostar grande obrigado obrigada hoje hora hospital
homem higiene irmão irmã janela jantar jardim jogar junto leite ler levantar ligar
livro lugar luz mãe mão mais mamãe manhã maçã médico melhor menos meu minha muito
muita mulher mundo música nada não necessário nome novo nova nós nosso nossa nunca
olhar onde ontem ouvir óculos ônibus olá pai pão papai para parar passear paz pedir
pegar pequeno pequena perto pessoa pessoas pé precisa preciso precisar presente pode
podemos poder por porque porta posso pra prazer primeiro problema professor
professora quando quanto quero querer quem queijo quente rápido receber remédio
responder roupa rua ruim saber sair sala saúde saudade sede sem sempre sentar sentir
ser sim sozinho sozinha sono sorrir sou sua seu suco tarde também tchau telefone
televisão tenho tem temos tempo terminar tomar trabalho trabalhar trazer triste tudo
um uma usar vai vamos ver vestir vez viajar vida vir você vocês voltar vontade vou
veio verdade
`
  .trim()
  .split(/\s+/);

const normalize = word =>
  word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export const currentWord = text => (text.match(/[A-Za-zÀ-ÿ]+$/) || [''])[0];

export function getSuggestions(text, phrases = [], caps = false) {
  const prefix = currentWord(text);
  if (prefix.length < 2) return [];
  const learned = phrases.join(' ').match(/[A-Za-zÀ-ÿ]+/g) || [];
  const candidates = [
    ...new Set([
      ...learned.map(word => word.toLowerCase()),
      ...words,
      ...portugueseWords
    ])
  ];
  return candidates
    .filter(
      word =>
        normalize(word).startsWith(normalize(prefix)) &&
        word !== prefix.toLowerCase()
    )
    .map(word => {
      if (caps || prefix === prefix.toUpperCase()) return word.toUpperCase();
      if (prefix[0] === prefix[0].toUpperCase())
        return word[0].toUpperCase() + word.slice(1);
      return word;
    });
}

export function completeWord(text, word) {
  return text.slice(0, text.length - currentWord(text).length) + word + ' ';
}
