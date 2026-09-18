@echo off
echo ============================================
echo   Automeo v0.15.4 安装包合并工具
echo ============================================
echo.
echo 正在合并安装包分卷...
copy /b Automeo-Setup-0.15.4.exe.part1 + Automeo-Setup-0.15.4.exe.part2 + Automeo-Setup-0.15.4.exe.part3 Automeo-Setup-0.15.4.exe
if exist Automeo-Setup-0.15.4.exe (
  echo.
  echo 合并成功！请运行 Automeo-Setup-0.15.4.exe 进行安装
) else (
  echo.
  echo 合并失败，请检查分卷文件是否齐全
)
pause