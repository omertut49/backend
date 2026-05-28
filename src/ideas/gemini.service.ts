import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor(private config: ConfigService) {
    const key = this.config.get<string>('GEMINI_API_KEY') ?? '';
    this.genAI = new GoogleGenerativeAI(key);
  }

  async analyzeIdeas(
    sessionTitle: string,
    sessionDescription: string | null,
    ideas: Array<{
      title: string;
      description: string | null;
      voteCount: number;
      mechanics: Array<{ title: string; description: string | null; voteCount: number }>;
    }>,
  ): Promise<string> {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) throw new InternalServerErrorException('GEMINI_API_KEY tanımlı değil');

    const ideasText = ideas
      .sort((a, b) => b.voteCount - a.voteCount)
      .map((idea, i) => {
        const mechanics =
          idea.mechanics.length > 0
            ? idea.mechanics
                .sort((a, b) => b.voteCount - a.voteCount)
                .map((m) => `   • ${m.title} (${m.voteCount} oy)${m.description ? ': ' + m.description : ''}`)
                .join('\n')
            : '   • Henüz mekanik önerilmedi';
        return [
          `${i + 1}. ${idea.title} — ${idea.voteCount} oy`,
          idea.description ? `   ${idea.description}` : null,
          `   Mekanikler:\n${mechanics}`,
        ]
          .filter(Boolean)
          .join('\n');
      })
      .join('\n\n');

    const prompt = `Sen deneyimli bir oyun tasarım danışmanısın. Bir oyun geliştirme ekibi, aşağıdaki oyun fikirlerini ve mekaniklerini önerdi ve oyladı.

Oturum: ${sessionTitle}${sessionDescription ? `\nKonu: ${sessionDescription}` : ''}

─── Oyun Fikirleri ve Mekanikler ───
${ideasText}
────────────────────────────────────

Lütfen Türkçe olarak şunları yap:

**1. Ekip Eğilimi** (2-3 cümle)
Ekibin hangi tür oyun ve mekaniğe yöneldiğini oy dağılımını göz önünde bulundurarak özetle.

**2. Önerilen Oyun Konsepti**
Oy sayılarını baz alarak en güçlü fikirleri birleştiren optimal bir oyun konsepti öner. Tür, atmosfer ve hedef kitlesini belirt.

**3. Temel Mekanikler** (3-5 madde)
Bu konsept için en uygun mekanikleri listele.

**4. Sonuç**
1-2 cümleyle net bir karar tavsiyesi ver.

Maksimum 350 kelime, sade ve uygulanabilir bir dil kullan.`;

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err: any) {
      throw new InternalServerErrorException('AI analizi başarısız: ' + (err?.message ?? 'Bilinmeyen hata'));
    }
  }
}
