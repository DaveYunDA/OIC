// 评分系统类型定义
export interface RankingOption {
  text: string; // 选项文本
  tag: string;  // 选项标签（用于标识）
}

export interface ScoringMap {
  disagree: string; // 不同意时的映射标签
  agree: string;    // 同意时的映射标签
}

// Likert 量表分值映射（常用于心理测量问卷）
export const LikertScores = {
  "Strongly disagree": 2, // 非常不同意
  "Disagree": 1,          // 不同意
  "Neutral": 0,           // 中立
  "Agree": 1,             // 同意
  "Strongly agree": 2     // 非常同意
} as const;

// Q32 题组维度映射（用于特定题目的分数归类）
export const Q32ScoringMap: Record<string, ScoringMap> = {
  Q32_1: { disagree: "A", agree: "R" },
  Q32_2: { disagree: "C", agree: "A" },
  Q32_3: { disagree: "S", agree: "I" },
  Q32_4: { disagree: "I", agree: "E" },
  Q32_5: { disagree: "R", agree: "S" },
  Q32_6: { disagree: "E", agree: "C" },
};

// Q33 题组维度映射（用于特定题目的分数归类）
export const Q33ScoringMap: Record<string, ScoringMap> = {
  Q33_1: { disagree: "E", agree: "I" },
  Q33_2: { disagree: "P", agree: "J" },
  Q33_3: { disagree: "I", agree: "E" },
  Q33_4: { disagree: "N", agree: "S" },
  Q33_5: { disagree: "T", agree: "F" },
  Q33_6: { disagree: "P", agree: "J" },
  Q33_7: { disagree: "F", agree: "T" },
  Q33_8: { disagree: "S", agree: "N" },
  Q33_9: { disagree: "J", agree: "P" },
  Q33_10: { disagree: "E", agree: "I" },
  Q33_11: { disagree: "N", agree: "S" },
  Q33_12: { disagree: "F", agree: "T" },
};

// 用户答案类型
export interface UserAnswer {
  value: string;      // 用户选择的值
  otherValue?: string; // 其他补充内容（如“其他”选项填写）
}

export interface UserAnswers {
  [key: string]: UserAnswer; // 题号到答案的映射
}

// 评分结果类型
export interface ScoringResult {
  [key: string]: number | Record<string, number>; // 维度分数或嵌套分数
}

/**
 * 计算问卷总分
 * @param answers 用户答案
 * @returns 各维度得分
 */
export function calculateScores(answers: UserAnswers): ScoringResult {
  const result: Record<string, number> = {};

  // Q13–Q31：排序题评分
  for (let i = 13; i <= 31; i++) {
    const qid = `Q${i}`;
    const raw = answers[qid]?.value;
    if (!raw) continue;
    
    try {
      const tags = JSON.parse(raw);
      tags.forEach((tag: string, idx: number) => {
        const score = 5 - idx;
        result[tag] = (result[tag] || 0) + score;
      });
    } catch (error) {
      console.error(`Error parsing answer for ${qid}:`, error);
    }
  }

  // Q32：Likert题评分
  const q32Results: Record<string, number> = {};
  Object.keys(Q32ScoringMap).forEach(qid => {
    const val = answers[qid]?.value;
    if (!val || val === "Neutral") return;
    
    const score = LikertScores[val as keyof typeof LikertScores];
    const dim = ["Strongly disagree", "Disagree"].includes(val)
      ? Q32ScoringMap[qid].disagree
      : Q32ScoringMap[qid].agree;
    
    q32Results[dim] = (q32Results[dim] || 0) + score;
  });
  
  // Q33：Likert题评分
  const q33Results: Record<string, number> = {};
  Object.keys(Q33ScoringMap).forEach(qid => {
    const val = answers[qid]?.value;
    if (!val || val === "Neutral") return;
    
    const score = LikertScores[val as keyof typeof LikertScores];
    const dim = ["Strongly disagree", "Disagree"].includes(val)
      ? Q33ScoringMap[qid].disagree
      : Q33ScoringMap[qid].agree;
    
    q33Results[dim] = (q33Results[dim] || 0) + score;
  });

  // 返回所有得分
  return {
    ...result,
    Q32: q32Results,
    Q33: q33Results
  };
}