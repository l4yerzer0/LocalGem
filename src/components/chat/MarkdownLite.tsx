import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors, fonts } from '../../theme/colors';

interface MarkdownLiteProps {
  content: string;
}

export const MarkdownLite: React.FC<MarkdownLiteProps> = ({ content }) => {
  // 1. Разбиваем на строки для обработки заголовков и списков
  const lines = content.split('\n');
  
  const renderLine = (line: string, index: number) => {
    let cleanLine = line;

    // Обработка заголовков (###)
    if (cleanLine.startsWith('### ')) {
      return (
        <Text key={index} style={styles.h3}>
          {cleanLine.replace('### ', '')}
        </Text>
      );
    }

    // Обработка списков (*)
    if (cleanLine.trim().startsWith('* ')) {
      return (
        <View key={index} style={styles.listItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.plainText}>{renderInline(cleanLine.trim().replace('* ', ''))}</Text>
        </View>
      );
    }

    // Обычная строка
    return (
      <Text key={index} style={styles.plainText}>
        {renderInline(cleanLine)}
      </Text>
    );
  };

  // Обработка жирного текста и инлайнового кода внутри строки
  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <Text key={i} style={styles.boldText}>{part.slice(2, -2)}</Text>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <Text key={i} style={styles.inlineCode}>{part.slice(1, -1)}</Text>;
      }
      return part;
    });
  };

  // Обработка блоков кода (```)
  const blocks = content.split(/(```[\s\S]*?```)/g);

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => {
        if (block.startsWith('```')) {
          const rawCode = block.replace(/```/g, '').trim();
          const lines = rawCode.split('\n');
          const lang = lines[0].length < 10 ? lines[0] : '';
          const code = lang ? lines.slice(1).join('\n') : rawCode;

          return (
            <View key={index} style={styles.codeBlock}>
              {lang ? <Text style={styles.codeLang}>{lang.toUpperCase()}</Text> : null}
              <Text style={styles.codeText}>{highlightCode(code)}</Text>
            </View>
          );
        }

        // Рендерим обычные строки внутри текстового блока
        return (
          <View key={index}>
            {block.split('\n').map((line, i) => renderLine(line, i))}
          </View>
        );
      })}
    </View>
  );
};

// Простейшая подсветка синтаксиса
const highlightCode = (code: string) => {
  const keywords = /\b(package|import|func|var|type|struct|return|if|else|for|range|string|int|float64|bool|nil|true|false)\b/g;
  const parts = code.split(keywords);
  
  return parts.map((part, i) => {
    if (part.match(keywords)) {
      return <Text key={i} style={styles.codeKeyword}>{part}</Text>;
    }
    // Подсветка строк в кавычках
    if (part.startsWith('"') || part.startsWith('`')) {
        return <Text key={i} style={styles.codeString}>{part}</Text>;
    }
    return part;
  });
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  plainText: {
    fontSize: 15,
    lineHeight: 24,
    fontFamily: fonts.regular,
    color: '#d1d5db',
    marginBottom: 2,
  },
  boldText: {
    fontFamily: fonts.semiBold,
    color: '#ffffff',
  },
  inlineCode: {
    backgroundColor: '#2b2b28',
    color: colors.accent,
    paddingHorizontal: 4,
    borderRadius: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
  },
  h3: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  listItem: {
    flexDirection: 'row',
    paddingLeft: 8,
    marginBottom: 4,
  },
  bullet: {
    color: colors.accent,
    marginRight: 8,
    fontSize: 18,
  },
  codeBlock: {
    backgroundColor: '#0d0d0d',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  codeLang: {
    fontSize: 10,
    fontFamily: fonts.semiBold,
    color: '#666666',
    marginBottom: 8,
  },
  codeText: {
    fontSize: 13,
    color: '#e6e6e6',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 20,
  },
  codeKeyword: {
    color: '#d97757', // Фирменный оранжевый для ключевых слов
    fontWeight: 'bold',
  },
  codeString: {
    color: '#10b981', // Зеленый для строк
  }
});
