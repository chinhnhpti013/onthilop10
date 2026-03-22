import { Type } from "@google/genai";

export interface Question {
  id: string;
  subject: 'math' | 'literature' | 'english';
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  content: string;
  options?: string[];
  answer: string;
  explanation: string;
}

export interface Exam {
  id: string;
  title: string;
  subject: 'math' | 'literature' | 'english';
  duration: number; // minutes
  questions: Question[];
}

export interface UserProgress {
  completedLessons: string[];
  examHistory: {
    examId: string;
    score: number;
    date: string;
    subject: string;
  }[];
  weakTopics: string[];
}

export const MOCK_DATA = {
  math: {
    theory: [
      { id: 'm1', title: 'Căn bậc hai, Căn bậc ba', content: 'Lý thuyết về căn bậc hai, các phép biến đổi đơn giản, trục căn thức ở mẫu...' },
      { id: 'm2', title: 'Hàm số bậc nhất', content: 'Đồ thị hàm số y = ax + b (a # 0). Vị trí tương đối của hai đường thẳng...' },
      { id: 'm3', title: 'Hệ hai phương trình bậc nhất hai ẩn', content: 'Phương pháp thế, phương pháp cộng đại số. Giải bài toán bằng cách lập hệ phương trình...' },
      { id: 'm4', title: 'Phương trình bậc hai một ẩn', content: 'Công thức nghiệm, hệ thức Vi-ét và ứng dụng...' },
      { id: 'm5', title: 'Hệ thức lượng trong tam giác vuông', content: 'Các hệ thức về cạnh và đường cao, tỉ số lượng giác của góc nhọn...' },
      { id: 'm6', title: 'Đường tròn', content: 'Sự xác định đường tròn, tính chất đối xứng, vị trí tương đối của đường thẳng và đường tròn...' }
    ],
    questions: [
      {
        id: 'mq1',
        subject: 'math',
        topic: 'Căn bậc hai',
        difficulty: 'easy',
        content: 'Giá trị của biểu thức √(√3 - 2)² là:',
        options: ['√3 - 2', '2 - √3', '√3 + 2', '-(√3 + 2)'],
        answer: '2 - √3',
        explanation: '√(A²) = |A|. Vì √3 < 2 nên √3 - 2 < 0, do đó |√3 - 2| = 2 - √3.'
      },
      {
        id: 'mq2',
        subject: 'math',
        topic: 'Hàm số',
        difficulty: 'medium',
        content: 'Đường thẳng y = (m-1)x + 2 song song với đường thẳng y = 3x + 1 khi:',
        options: ['m = 4', 'm = 3', 'm = 2', 'm = -2'],
        answer: 'm = 4',
        explanation: 'Hai đường thẳng song song khi a = a\' và b # b\'. Ta có m - 1 = 3 => m = 4. (2 # 1 luôn đúng).'
      },
      {
        id: 'mq3',
        subject: 'math',
        topic: 'Hệ thức Vi-ét',
        difficulty: 'hard',
        content: 'Cho phương trình x² - 5x + 6 = 0. Tổng và tích hai nghiệm x1, x2 là:',
        options: ['S=5, P=6', 'S=-5, P=6', 'S=6, P=5', 'S=5, P=-6'],
        answer: 'S=5, P=6',
        explanation: 'Theo hệ thức Vi-ét: S = -b/a = -(-5)/1 = 5; P = c/a = 6/1 = 6.'
      }
    ]
  },
  english: {
    theory: [
      { id: 'e1', title: 'Tenses (Các thì)', content: 'Hiện tại đơn, hiện tại hoàn thành, quá khứ đơn, tương lai đơn...' },
      { id: 'e2', title: 'Passive Voice (Câu bị động)', content: 'Cấu trúc câu bị động: S + be + V3/ed + (by O)...' },
      { id: 'e3', title: 'Relative Clauses (Mệnh đề quan hệ)', content: 'Who, Whom, Which, That, Whose...' },
      { id: 'e4', title: 'Conditional Sentences (Câu điều kiện)', content: 'Loại 1 (có thật ở hiện tại), Loại 2 (không có thật ở hiện tại)...' },
      { id: 'e5', title: 'Reported Speech (Câu gián tiếp)', content: 'Quy tắc lùi thì, đổi đại từ, đổi trạng từ chỉ thời gian/nơi chốn...' }
    ],
    questions: [
      {
        id: 'eq1',
        subject: 'english',
        topic: 'Tenses',
        difficulty: 'easy',
        content: 'She ___ (watch) TV when the phone rang.',
        options: ['watches', 'is watching', 'was watching', 'watched'],
        answer: 'was watching',
        explanation: 'Hành động đang xảy ra (quá khứ tiếp diễn) thì có hành động khác xen vào (quá khứ đơn).'
      },
      {
        id: 'eq2',
        subject: 'english',
        topic: 'Relative Clauses',
        difficulty: 'medium',
        content: 'The man ___ lives next door is a famous doctor.',
        options: ['who', 'whom', 'which', 'whose'],
        answer: 'who',
        explanation: '"Who" làm chủ ngữ thay thế cho danh từ chỉ người (The man).'
      }
    ]
  },
  literature: {
    theory: [
      { id: 'l1', title: 'Nghị luận xã hội', content: 'Cách lập dàn ý bài văn nghị luận về một hiện tượng đời sống hoặc tư tưởng đạo lý...' },
      { id: 'l2', title: 'Chuyện người con gái Nam Xương', content: 'Tác giả Nguyễn Dữ. Giá trị nhân đạo, hiện thực và bi kịch của người phụ nữ...' },
      { id: 'l3', title: 'Đoàn thuyền đánh cá', content: 'Tác giả Huy Cận. Vẻ đẹp tráng lệ của thiên nhiên và con người lao động mới...' },
      { id: 'l4', title: 'Bếp lửa', content: 'Tác giả Bằng Việt. Tình bà cháu thiêng liêng, ấm áp và tình yêu quê hương...' },
      { id: 'l5', title: 'Lặng lẽ Sa Pa', content: 'Tác giả Nguyễn Thành Long. Vẻ đẹp của những con người lao động thầm lặng...' }
    ],
    questions: [
      {
        id: 'lq1',
        subject: 'literature',
        topic: 'Tác phẩm',
        difficulty: 'medium',
        content: 'Nhân vật chính trong tác phẩm "Lặng lẽ Sa Pa" là ai?',
        options: ['Ông họa sĩ', 'Cô kỹ sư', 'Anh thanh niên', 'Bác lái xe'],
        answer: 'Anh thanh niên',
        explanation: 'Anh thanh niên 27 tuổi làm công tác khí tượng kiêm vật lý địa cầu trên đỉnh Yên Sơn là nhân vật trung tâm.'
      },
      {
        id: 'lq2',
        subject: 'literature',
        topic: 'Nghị luận',
        difficulty: 'easy',
        content: 'Bố cục của một bài văn nghị luận thường gồm mấy phần?',
        options: ['2 phần', '3 phần', '4 phần', '5 phần'],
        answer: '3 phần',
        explanation: 'Bố cục chuẩn gồm: Mở bài, Thân bài và Kết bài.'
      }
    ]
  }
};
