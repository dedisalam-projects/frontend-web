import os
import re

file_path = r'D:\dedisalam\fullstack\backend\apps\user-service\src\auth\auth.service.spec.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """    it('should throw BadRequestException if deleted user is missing during delete', async () => {
      mockUserModel.findById.mockResolvedValueOnce({ _id: 'u3', role: 'user', email: 'test@example.com' });
      mockUserModel.findByIdAndDelete.mockResolvedValueOnce(null);
      await expect(service.deleteUser('u3')).rejects.toThrow('User not found');
    });

    it('should throw BadRequestException if user not found'"""

new_content = content.replace("    it('should throw BadRequestException if user not found'", replacement)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
print("Success: Updated coverage via Python")
