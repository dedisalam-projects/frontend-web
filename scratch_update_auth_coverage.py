import os
import re

file_path = r'D:\dedisalam\fullstack\backend\apps\user-service\src\auth\auth.service.spec.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """    it('should throw BadRequestException if user email is superadmin@example.com', async () => {
      mockUserModel.findById.mockResolvedValueOnce({ _id: 'u2', role: 'admin', email: 'superadmin@example.com' });
      await expect(service.deleteUser('u2')).rejects.toThrow('Cannot delete superadmin user');
    });

    it('should throw BadRequestException if user not found'"""

new_content = content.replace("    it('should throw BadRequestException if user not found'", replacement)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
print("Success: Updated coverage via Python")
