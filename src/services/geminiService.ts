import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export const getAITutorResponse = async (prompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: `Bạn là một gia sư ôn thi vào lớp 10 chuyên nghiệp tại Việt Nam. 
        Khi giải thích bài tập hoặc kiến thức, bạn phải:
        1. Giải thích chi tiết từng bước một (step-by-step).
        2. Cung cấp ít nhất một ví dụ minh họa cụ thể và dễ hiểu.
        3. Sau khi giải thích xong, hãy đưa ra 1-2 bài tập tự luyện tương tự (kèm đáp án ẩn hoặc gợi ý) để học sinh thực hành ngay.
        Luôn sử dụng ngôn ngữ gần gũi, khích lệ và bám sát cấu trúc đề thi vào lớp 10 thực tế.`,
      },
    });
    return response.text;
  } catch (error) {
    console.error("AI Error:", error);
    return "Xin lỗi, mình đang gặp chút trục trặc. Bạn thử hỏi lại nhé!";
  }
};

export const analyzeMistake = async (question: string, userAnswer: string, correctAnswer: string) => {
  const prompt = `Câu hỏi: ${question}\nCâu trả lời của học sinh: ${userAnswer}\nĐáp án đúng: ${correctAnswer}\n
  Hãy phân tích tại sao học sinh sai, giải thích kiến thức liên quan một cách chi tiết kèm ví dụ minh họa, và đưa ra 1 bài tập tương tự để học sinh luyện tập lại ngay.`;
  return getAITutorResponse(prompt);
};

export const generateExamSummary = async (subject: string, score: number, results: any[]) => {
  const prompt = `Học sinh vừa hoàn thành bài thi môn ${subject} với số điểm ${score}/10. 
  Chi tiết các câu hỏi và kết quả: ${JSON.stringify(results.map(r => ({ topic: r.topic, isCorrect: r.isCorrect })))}.
  Hãy viết một bản tóm tắt ngắn gọn (khoảng 3-4 câu) nhận xét về điểm mạnh, điểm yếu và lời khuyên để học sinh tiến bộ hơn.`;
  return getAITutorResponse(prompt);
};
