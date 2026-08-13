import os
from fpdf import FPDF
from io import BytesIO

class PDFReport(FPDF):
    def header(self):
        # Top banner background
        self.set_fill_color(30, 41, 59) # Slate 800
        self.rect(0, 0, 210, 35, 'F')
        
        self.set_font('helvetica', 'B', 24)
        self.set_text_color(250, 204, 21) # Gold
        self.set_xy(15, 10)
        self.cell(0, 10, 'Expendora', ln=0, align='L')
        
        self.set_font('helvetica', '', 14)
        self.set_text_color(255, 255, 255)
        self.cell(0, 10, 'Monthly Spending Report', ln=1, align='R')
        self.ln(15)

    def footer(self):
        self.set_y(-15)
        self.set_font('helvetica', 'I', 9)
        self.set_text_color(148, 163, 184) # Slate 400
        self.cell(0, 10, 'Generated automatically by Expendora', ln=0, align='L')
        self.cell(0, 10, f'Page {self.page_no()}', ln=0, align='R')

def generate_monthly_pdf(user_name, month, analytics_data):
    """
    Generates a modern, professional PDF report using fpdf2.
    """
    pdf = PDFReport()
    pdf.add_page()
    
    # Margins
    pdf.set_left_margin(15)
    pdf.set_right_margin(15)
    pdf.set_y(45)
    
    # Meta info
    pdf.set_font('helvetica', 'B', 12)
    pdf.set_text_color(30, 41, 59) # Slate 800
    pdf.cell(0, 6, f'Prepared for: {user_name}', ln=True)
    pdf.set_font('helvetica', '', 11)
    pdf.set_text_color(100, 116, 139) # Slate 500
    pdf.cell(0, 6, f'Statement Period: {month}', ln=True)
    pdf.ln(10)
    
    # --- BUDGET PERFORMANCE ---
    budget_status = analytics_data.get('budget_status', {})
    limit = budget_status.get('monthly_limit', 0)
    spent = budget_status.get('monthly_spent', 0)
    remaining = budget_status.get('remaining', 0)
    
    # Draw a light card background for budget
    pdf.set_fill_color(248, 250, 252) # Slate 50
    pdf.set_draw_color(226, 232, 240) # Slate 200
    pdf.rect(15, pdf.get_y(), 180, 40, 'FD')
    
    pdf.set_xy(20, pdf.get_y() + 5)
    pdf.set_font('helvetica', 'B', 14)
    pdf.set_text_color(30, 41, 59)
    pdf.cell(0, 8, 'Budget Performance', ln=True)
    
    pdf.set_font('helvetica', '', 11)
    pdf.set_x(20)
    pdf.cell(60, 6, f'Monthly Limit: Rs. {limit:,.2f}', ln=0)
    pdf.cell(60, 6, f'Total Spent: Rs. {spent:,.2f}', ln=0)
    pdf.cell(50, 6, f'Remaining: Rs. {remaining:,.2f}', ln=1)
    
    # Progress bar
    pdf.ln(5)
    bar_y = pdf.get_y()
    pdf.set_x(20)
    pdf.set_fill_color(226, 232, 240) # Slate 200 (Background)
    pdf.rect(20, bar_y, 170, 6, 'F')
    
    if limit > 0:
        pct = min(1.0, spent / limit)
        is_over = spent >= limit
        if is_over:
            pdf.set_fill_color(239, 68, 68) # Red 500
        elif pct > 0.8:
            pdf.set_fill_color(245, 158, 11) # Amber 500
        else:
            pdf.set_fill_color(34, 197, 94) # Green 500
            
        pdf.rect(20, bar_y, 170 * pct, 6, 'F')
        
    pdf.ln(12)
    
    # --- OVERVIEW ---
    pdf.ln(5)
    pdf.set_font('helvetica', 'B', 16)
    pdf.set_text_color(30, 41, 59)
    pdf.cell(0, 10, 'Overview', ln=True)
    
    # Draw line under title
    pdf.set_draw_color(226, 232, 240)
    pdf.line(15, pdf.get_y(), 195, pdf.get_y())
    pdf.ln(4)
    
    monthly_total = analytics_data.get('monthly_total', 0)
    tx_count = analytics_data.get('transaction_count', 0)
    daily_avg = analytics_data.get('daily_average', 0)
    
    # Overview boxes (3 columns)
    start_y = pdf.get_y()
    
    # Box 1
    pdf.set_fill_color(248, 250, 252)
    pdf.rect(15, start_y, 55, 20, 'F')
    pdf.set_xy(15, start_y + 4)
    pdf.set_font('helvetica', '', 10)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(55, 5, 'Total Spend', align='C', ln=1)
    pdf.set_x(15)
    pdf.set_font('helvetica', 'B', 12)
    pdf.set_text_color(30, 41, 59)
    pdf.cell(55, 7, f'Rs. {monthly_total:,.2f}', align='C')
    
    # Box 2
    pdf.rect(77.5, start_y, 55, 20, 'F')
    pdf.set_xy(77.5, start_y + 4)
    pdf.set_font('helvetica', '', 10)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(55, 5, 'Transactions', align='C', ln=1)
    pdf.set_x(77.5)
    pdf.set_font('helvetica', 'B', 12)
    pdf.set_text_color(30, 41, 59)
    pdf.cell(55, 7, f'{tx_count}', align='C')
    
    # Box 3
    pdf.rect(140, start_y, 55, 20, 'F')
    pdf.set_xy(140, start_y + 4)
    pdf.set_font('helvetica', '', 10)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(55, 5, 'Daily Average', align='C', ln=1)
    pdf.set_x(140)
    pdf.set_font('helvetica', 'B', 12)
    pdf.set_text_color(30, 41, 59)
    pdf.cell(55, 7, f'Rs. {daily_avg:,.2f}', align='C')
    
    pdf.set_y(start_y + 25)
    
    # --- CATEGORY BREAKDOWN ---
    pdf.ln(5)
    pdf.set_font('helvetica', 'B', 16)
    pdf.set_text_color(30, 41, 59)
    pdf.cell(0, 10, 'Category Breakdown', ln=True)
    pdf.line(15, pdf.get_y(), 195, pdf.get_y())
    pdf.ln(4)
    
    pdf.set_fill_color(248, 250, 252)
    pdf.set_font('helvetica', 'B', 10)
    pdf.set_text_color(100, 116, 139)
    
    pdf.cell(80, 8, '  Category', border=0, fill=True)
    pdf.cell(50, 8, 'Amount ', border=0, fill=True, align='R')
    pdf.cell(50, 8, '% of Total  ', border=0, fill=True, align='R')
    pdf.ln()
    
    pdf.set_font('helvetica', '', 11)
    pdf.set_text_color(30, 41, 59)
    
    breakdown = analytics_data.get('category_breakdown', [])
    for item in breakdown:
        pdf.cell(80, 10, f"  {item['category']}", border='B')
        pdf.cell(50, 10, f"Rs. {item['total']:,.2f} ", border='B', align='R')
        pdf.cell(50, 10, f"{item['percentage']}%  ", border='B', align='R')
        pdf.ln()
        
    pdf.ln(10)
    
    # --- TRANSACTIONS LIST ---
    expenses_list = analytics_data.get('expenses', [])
    if expenses_list:
        pdf.set_font('helvetica', 'B', 16)
        pdf.set_text_color(30, 41, 59)
        pdf.cell(0, 10, 'Transactions List', ln=True)
        pdf.line(15, pdf.get_y(), 195, pdf.get_y())
        pdf.ln(4)
        
        pdf.set_fill_color(248, 250, 252)
        pdf.set_font('helvetica', 'B', 10)
        pdf.set_text_color(100, 116, 139)
        
        pdf.cell(30, 8, '  Date', border=0, fill=True)
        pdf.cell(70, 8, 'Merchant', border=0, fill=True)
        pdf.cell(40, 8, 'Category', border=0, fill=True)
        pdf.cell(40, 8, 'Amount  ', border=0, fill=True, align='R')
        pdf.ln()
        
        pdf.set_font('helvetica', '', 10)
        pdf.set_text_color(30, 41, 59)
        
        for exp in expenses_list:
            pdf.cell(30, 10, f"  {exp['date']}", border='B')
            pdf.cell(70, 10, str(exp['merchant'])[:30], border='B')
            pdf.cell(40, 10, str(exp['category']).capitalize(), border='B')
            pdf.cell(40, 10, f"Rs. {exp['amount']:,.2f}  ", border='B', align='R')
            pdf.ln()
            
        pdf.ln(10)
    
    # Output to BytesIO
    pdf_buffer = BytesIO()
    pdf.output(pdf_buffer)
    pdf_buffer.seek(0)
    return pdf_buffer
