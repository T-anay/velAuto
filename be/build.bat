@echo off
cd /d "C:\Users\talhaanay\Documents\GitHub\velAuto\be"
call mvn clean install -DskipTests -q
if %ERRORLEVEL% EQU 0 (
    echo BUILD SUCCESS
) else (
    echo BUILD FAILED
    mvn clean install -DskipTests 2>&1 | findstr /i "error"
)
pause

