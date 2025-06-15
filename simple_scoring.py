#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
轻量化问卷评分脚本
功能：从数据库拉取数据，计算得分，导出Excel
"""

import os
import json
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime

# 加载环境变量
load_dotenv()

def get_supabase_client():
    """获取Supabase客户端"""
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    if not url or not key:
        raise ValueError("请在.env文件中设置NEXT_PUBLIC_SUPABASE_URL和NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    return create_client(url, key)

def calculate_ranking_scores(answer_str):
    """
    计算排序题得分 (Q8-Q17: HLAFPS; Q18-Q26: AESRCI)
    输入: JSON字符串，如 '["A", "E", "S", "R", "C", "I"]'
    输出: 字典，如 {'A': 5, 'E': 4, 'S': 3, 'R': 2, 'C': 1, 'I': 0}
    """
    try:
        order = json.loads(answer_str)
        scores = {}
        for i, tag in enumerate(order):
            scores[tag] = 5 - i  # 第1名5分，第2名4分...第6名0分
        return scores
    except:
        # 返回空字典，让调用方处理
        return {}

def calculate_q8_to_q17_scores(answers):
    """计算Q8-Q17题得分 (Holland HLAFPS)"""
    total_scores = {'H': 0, 'L': 0, 'A': 0, 'F': 0, 'P': 0, 'S': 0}
    for q_num in range(8, 18):  # Q8到Q17
        q_id = f'Q{q_num}'
        if q_id in answers:
            scores = calculate_ranking_scores(answers[q_id]['value'])
            for dim, score in scores.items():
                if dim in total_scores:
                    total_scores[dim] += score
    return total_scores

def calculate_q18_to_q26_scores(answers):
    """计算Q18-Q26题得分 (RIASEC AESRCI)"""
    total_scores = {'A': 0, 'E': 0, 'S': 0, 'R': 0, 'C': 0, 'I': 0}
    for q_num in range(18, 27):  # Q18到Q26
        q_id = f'Q{q_num}'
        if q_id in answers:
            scores = calculate_ranking_scores(answers[q_id]['value'])
            for dim, score in scores.items():
                if dim in total_scores:
                    total_scores[dim] += score
    return total_scores

def calculate_q27_to_q32_scores(answers):
    """计算Q27-Q32题得分 (AESRCI)"""
    scores = {'A': 0, 'E': 0, 'S': 0, 'R': 0, 'C': 0, 'I': 0}
    
    # Q27-Q32评分映射
    scoring_map = {
        'Q27': {'Strongly agree': {'A': 2}, 'Agree': {'A': 1}, 'Disagree': {'R': 1}, 'Strongly disagree': {'R': 2}},
        'Q28': {'Strongly agree': {'C': 2}, 'Agree': {'C': 1}, 'Disagree': {'A': 1}, 'Strongly disagree': {'A': 2}},
        'Q29': {'Strongly agree': {'S': 2}, 'Agree': {'S': 1}, 'Disagree': {'I': 1}, 'Strongly disagree': {'I': 2}},
        'Q30': {'Strongly agree': {'I': 2}, 'Agree': {'I': 1}, 'Disagree': {'E': 1}, 'Strongly disagree': {'E': 2}},
        'Q31': {'Strongly agree': {'R': 2}, 'Agree': {'R': 1}, 'Disagree': {'S': 1}, 'Strongly disagree': {'S': 2}},
        'Q32': {'Strongly agree': {'E': 2}, 'Agree': {'E': 1}, 'Disagree': {'C': 1}, 'Strongly disagree': {'C': 2}}
    }
    
    for q_id, mapping in scoring_map.items():
        if q_id in answers:
            answer_value = answers[q_id].get('value', '')
            if answer_value in mapping:
                for dimension, points in mapping[answer_value].items():
                    scores[dimension] += points
    
    return scores


def calculate_q33_to_q44_scores(answers):
    """计算Q33-Q44题得分（MBTI相关）"""
    scores = {'E': 0, 'I': 0, 'S': 0, 'N': 0, 'T': 0, 'F': 0, 'J': 0, 'P': 0}
    
    # Q33-Q44评分映射
    scoring_map = {
        'Q33': {'Strongly agree': {'E': 2}, 'Agree': {'E': 1}, 'Disagree': {'I': 1}, 'Strongly disagree': {'I': 2}},
        'Q34': {'Strongly agree': {'P': 2}, 'Agree': {'P': 1}, 'Disagree': {'J': 1}, 'Strongly disagree': {'J': 2}},
        'Q35': {'Strongly agree': {'I': 2}, 'Agree': {'I': 1}, 'Disagree': {'E': 1}, 'Strongly disagree': {'E': 2}},
        'Q36': {'Strongly agree': {'N': 2}, 'Agree': {'N': 1}, 'Disagree': {'S': 1}, 'Strongly disagree': {'S': 2}},
        'Q37': {'Strongly agree': {'T': 2}, 'Agree': {'T': 1}, 'Disagree': {'F': 1}, 'Strongly disagree': {'F': 2}},
        'Q38': {'Strongly agree': {'P': 2}, 'Agree': {'P': 1}, 'Disagree': {'J': 1}, 'Strongly disagree': {'J': 2}},
        'Q39': {'Strongly agree': {'F': 2}, 'Agree': {'F': 1}, 'Disagree': {'T': 1}, 'Strongly disagree': {'T': 2}},
        'Q40': {'Strongly agree': {'S': 2}, 'Agree': {'S': 1}, 'Disagree': {'N': 1}, 'Strongly disagree': {'N': 2}},
        'Q41': {'Strongly agree': {'J': 2}, 'Agree': {'J': 1}, 'Disagree': {'P': 1}, 'Strongly disagree': {'P': 2}},
        'Q42': {'Strongly agree': {'E': 2}, 'Agree': {'E': 1}, 'Disagree': {'I': 1}, 'Strongly disagree': {'I': 2}},
        'Q43': {'Strongly agree': {'N': 2}, 'Agree': {'N': 1}, 'Disagree': {'S': 1}, 'Strongly disagree': {'S': 2}},
        'Q44': {'Strongly agree': {'F': 2}, 'Agree': {'F': 1}, 'Disagree': {'T': 1}, 'Strongly disagree': {'T': 2}}
    }
    
    for q_id, mapping in scoring_map.items():
        if q_id in answers:
            answer_value = answers[q_id].get('value', '')
            if answer_value in mapping:
                for dimension, points in mapping[answer_value].items():
                    scores[dimension] += points
    
    return scores


def format_scores(scores):
    """将得分格式化为字符串，如 'H:5, L:3, A:2, F:1, P:4, S:0'"""
    return ', '.join([f"{k}:{v}" for k, v in scores.items()])

def get_user_info(supabase, user_ids):
    """获取用户信息"""
    try:
        # 获取所有用户信息（注意字段名是username，不是name）
        user_response = supabase.table('users').select('id, username').execute()
        user_dict = {}
        if user_response.data:
            for user in user_response.data:
                user_dict[user['id']] = {
                    'username': user.get('username', ''),
                }
        return user_dict
    except Exception as e:
        print(f"⚠️ 获取用户信息失败: {e}")
        return {}

def main():
    """主函数"""
    print("开始拉取数据库数据并计算得分...")
    
    try:
        # 连接数据库
        supabase = get_supabase_client()
        print("✅ 数据库连接成功")
        
        # 拉取所有问卷数据
        print("正在查询 survey_results 表...")
        response = supabase.table('survey_results').select('*').execute()
        
        print(f"🔍 查询响应: {response}")
        print(f"🔍 响应数据长度: {len(response.data) if response.data else 0}")
        
        if not response.data:
            print("❌ 数据库中没有找到问卷数据")
            print("请检查表名是否正确，或者数据是否已存储")
            return
        
        print(f"成功拉取到 {len(response.data)} 条问卷数据")
        
        # 获取用户信息
        print("正在获取用户信息...")
        user_ids = list(set([record['user_id'] for record in response.data if record.get('user_id')]))
        user_dict = get_user_info(supabase, user_ids)
        print(f"成功获取到 {len(user_dict)} 个用户的信息")        # 处理数据
        processed_data = []
        
        for i, record in enumerate(response.data, 1):
            print(f"处理第 {i} 条数据...")
            
            try:
                # 解析答案
                answers = json.loads(record['answers'])
                # 获取用户信息
                user_info = user_dict.get(record['user_id'], {'username': '未知用户'})                # 基本信息
                row_data = {
                    'ID': record['id'],
                    'User_ID': record['user_id'], 
                    'Username': user_info['username'],
                    'Created_At': record['created_at']
                }
                
                # Section 1: 个人信息 (Q1-Q7)
                personal_info = {}
                for q_num in range(1, 8):  # Q1到Q7
                    q_id = f'Q{q_num}'
                    if q_id in answers:
                        answer_value = answers[q_id].get('value', '')
                        if isinstance(answer_value, dict):
                            personal_info[f'{q_id}'] = str(answer_value)
                        else:
                            personal_info[f'{q_id}'] = str(answer_value)
                    else:
                        personal_info[f'{q_id}'] = ''
                
                row_data['Section1_Personal_Info'] = json.dumps(personal_info, ensure_ascii=False)
                
                # Section 2: Holland评分 (Q8-Q17)
                section2_scores = calculate_q8_to_q17_scores(answers)
                row_data['Section2_Holland_Scores'] = format_scores(section2_scores)
                
                # Section 3: RIASEC评分 (Q18-Q26)
                section3_ranking_scores = calculate_q18_to_q26_scores(answers)
                
                # Section 3: 态度题得分 (Q27-Q32)
                section3_attitude_scores = calculate_q27_to_q32_scores(answers)
                
                # Section 3: 最终RIASEC得分 (排序题 + 态度题)
                section3_total_scores = {}
                for dim in ['A', 'E', 'S', 'R', 'C', 'I']:
                    section3_total_scores[dim] = section3_ranking_scores[dim] + section3_attitude_scores[dim]
                row_data['Section3_RIASEC_Scores'] = format_scores(section3_total_scores)                # Section 4: MBTI得分 (Q33-Q44)
                section4_scores = calculate_q33_to_q44_scores(answers)
                row_data['Section4_MBTI_Scores'] = format_scores(section4_scores)
                
                # Section 5: 横向思维 (Q45-Q48)
                section5_answers = {}
                for q_num in range(45, 49):  # Q45到Q48
                    q_id = f'Q{q_num}'
                    if q_id in answers:
                        answer_value = answers[q_id].get('value', '')
                        section5_answers[f'{q_id}'] = str(answer_value)[:500] if len(str(answer_value)) > 500 else str(answer_value)  # 限制长度避免Excel问题
                    else:
                        section5_answers[f'{q_id}'] = ''
                row_data['Section5_Lateral_Thinking'] = json.dumps(section5_answers, ensure_ascii=False)
                
                # Section 6: 学习风格和职业 (Q49-Q55)
                section6_answers = {}
                for q_num in range(49, 56):  # Q49到Q55
                    q_id = f'Q{q_num}'
                    if q_id in answers:
                        answer_value = answers[q_id].get('value', '')
                        if isinstance(answer_value, dict):
                            section6_answers[f'{q_id}'] = str(answer_value)
                        else:
                            section6_answers[f'{q_id}'] = str(answer_value)[:500] if len(str(answer_value)) > 500 else str(answer_value)  # 限制长度
                    else:
                        section6_answers[f'{q_id}'] = ''
                row_data['Section6_Study_Career'] = json.dumps(section6_answers, ensure_ascii=False)
                
                # 确定RIASEC类型 (得分最高的维度)
                max_riasec_dim = max(section3_total_scores, key=section3_total_scores.get)
                row_data['RIASEC_Type'] = max_riasec_dim
                
                # 确定Holland类型 (得分最高的维度)
                max_holland_dim = max(section2_scores, key=section2_scores.get)
                row_data['Holland_Type'] = max_holland_dim
                
                # 确定MBTI类型
                mbti_type = ""
                mbti_type += "E" if section4_scores['E'] > section4_scores['I'] else "I"
                mbti_type += "S" if section4_scores['S'] > section4_scores['N'] else "N"  
                mbti_type += "T" if section4_scores['T'] > section4_scores['F'] else "F"
                mbti_type += "J" if section4_scores['J'] > section4_scores['P'] else "P"
                row_data['MBTI_Type'] = mbti_type
                
                processed_data.append(row_data)
                
            except Exception as e:
                print(f"处理第 {i} 条数据时出错: {e}")
                continue
        
        # 创建DataFrame
        df = pd.DataFrame(processed_data)
        
        # 导出Excel
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f'survey_scores_{timestamp}.xlsx'
        
        df.to_excel(filename, index=False)
        
        print(f"\n✅ 成功处理 {len(processed_data)} 条数据")
        print(f"✅ Excel文件已导出: {filename}")
        print(f"✅ 文件包含列: {', '.join(df.columns.tolist())}")
        
    except Exception as e:
        print(f"❌ 发生错误: {e}")

if __name__ == "__main__":
    main()
