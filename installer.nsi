; BraydenSCE V2 Installer Script
; Uses NSIS 3.x with Modern UI 2

!include "MUI2.nsh"
!include "LogicLib.nsh"

;---- Basic info ----
Name "BraydenSCE V2"
OutFile "dist\BraydenSCE-Setup.exe"
InstallDir "$PROGRAMFILES64\BraydenSCE"
InstallDirRegKey HKLM "Software\BraydenSCE" "InstallDir"
RequestExecutionLevel admin

;---- MUI Settings ----
!define MUI_ABORTWARNING
!define MUI_ICON "${NSISDIR}\Contrib\Graphics\Icons\modern-install.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"

;---- Pages ----
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_RUN "$INSTDIR\server.exe"
!define MUI_FINISHPAGE_RUN_TEXT "立即启动 BraydenSCE V2"
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

;---- Language ----
!insertmacro MUI_LANGUAGE "SimpChinese"

;---- Install Section ----
Section "Install"
  SetOutPath "$INSTDIR"

  ; Copy main executable
  File "dist\bin\server.exe"

  ; Copy all web assets
  SetOutPath "$INSTDIR\assets"
  File /r "dist\assets\*.*"

  SetOutPath "$INSTDIR"
  File "dist\index.html"

  ; Write registry for uninstaller
  WriteRegStr HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\BraydenSCE" "DisplayName" "BraydenSCE V2"
  WriteRegStr HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\BraydenSCE" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\BraydenSCE" "InstallLocation" "$INSTDIR"
  WriteRegStr HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\BraydenSCE" "Publisher" "Braydenccc"
  WriteRegDWORD HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\BraydenSCE" "NoModify" 1
  WriteRegDWORD HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\BraydenSCE" "NoRepair" 1

  ; Create desktop shortcut
  CreateShortcut "$DESKTOP\BraydenSCE V2.lnk" "$INSTDIR\server.exe" "" "$INSTDIR\server.exe" 0

  ; Create start menu shortcut
  CreateDirectory "$SMPROGRAMS\BraydenSCE"
  CreateShortcut "$SMPROGRAMS\BraydenSCE\BraydenSCE V2.lnk" "$INSTDIR\server.exe"
  CreateShortcut "$SMPROGRAMS\BraydenSCE\Uninstall.lnk" "$INSTDIR\Uninstall.exe"

  ; Write uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"
SectionEnd

;---- Uninstall Section ----
Section "Uninstall"
  Delete "$INSTDIR\server.exe"
  Delete "$INSTDIR\index.html"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir /r "$INSTDIR\assets"
  RMDir "$INSTDIR"

  Delete "$DESKTOP\BraydenSCE V2.lnk"
  Delete "$SMPROGRAMS\BraydenSCE\BraydenSCE V2.lnk"
  Delete "$SMPROGRAMS\BraydenSCE\Uninstall.lnk"
  RMDir "$SMPROGRAMS\BraydenSCE"

  DeleteRegKey HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\BraydenSCE"
  DeleteRegKey HKLM "Software\BraydenSCE"
SectionEnd
