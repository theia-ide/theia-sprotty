@if "%DEBUG%" == "" @echo off
@rem ##########################################################################
@rem
@rem  yang-language-server startup script for Windows
@rem
@rem ##########################################################################

@rem Set local scope for the variables with windows NT shell
if "%OS%"=="Windows_NT" setlocal

set DIRNAME=%~dp0
if "%DIRNAME%" == "" set DIRNAME=.
set APP_BASE_NAME=%~n0
set APP_HOME=%DIRNAME%..

@rem Add default JVM options here. You can also use JAVA_OPTS and YANG_LANGUAGE_SERVER_OPTS to pass JVM options to this script.
set DEFAULT_JVM_OPTS="-agentlib:jdwp=transport=dt_socket,address=localhost:8787,server=y,suspend=n,quiet=y"

@rem Find java.exe
if defined JAVA_HOME goto findJavaFromJavaHome

set JAVA_EXE=java.exe
%JAVA_EXE% -version >NUL 2>&1
if "%ERRORLEVEL%" == "0" goto init

echo.
echo ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
echo.
echo Please set the JAVA_HOME variable in your environment to match the
echo location of your Java installation.

goto fail

:findJavaFromJavaHome
set JAVA_HOME=%JAVA_HOME:"=%
set JAVA_EXE=%JAVA_HOME%/bin/java.exe

if exist "%JAVA_EXE%" goto init

echo.
echo ERROR: JAVA_HOME is set to an invalid directory: %JAVA_HOME%
echo.
echo Please set the JAVA_HOME variable in your environment to match the
echo location of your Java installation.

goto fail

:init
@rem Get command-line arguments, handling Windows variants

if not "%OS%" == "Windows_NT" goto win9xME_args

:win9xME_args
@rem Slurp the command line arguments.
set CMD_LINE_ARGS=
set _SKIP=2

:win9xME_args_slurp
if "x%~1" == "x" goto execute

set CMD_LINE_ARGS=%*

:execute
@rem Setup the command line

set CLASSPATH=%APP_HOME%\lib\io.typefox.yang.diagram-0.1.0-SNAPSHOT.jar;%APP_HOME%\lib\io.typefox.yang.ide-0.1.0-SNAPSHOT.jar;%APP_HOME%\lib\org.eclipse.lsp4j-0.3.0-SNAPSHOT.jar;%APP_HOME%\lib\org.eclipse.elk.alg.layered-0.3.0-SNAPSHOT.jar;%APP_HOME%\lib\diagram-server-0.2.0-SNAPSHOT.jar;%APP_HOME%\lib\diagram-layout-engine-0.2.0-SNAPSHOT.jar;%APP_HOME%\lib\xtext-diagram-0.2.0-SNAPSHOT.jar;%APP_HOME%\lib\io.typefox.yang-0.1.0-SNAPSHOT.jar;%APP_HOME%\lib\org.eclipse.xtext.ide-2.13.0-SNAPSHOT.jar;%APP_HOME%\lib\org.eclipse.lsp4j.generator-0.3.0-SNAPSHOT.jar;%APP_HOME%\lib\org.eclipse.lsp4j.jsonrpc-0.3.0-SNAPSHOT.jar;%APP_HOME%\lib\org.eclipse.elk.core-0.3.0-SNAPSHOT.jar;%APP_HOME%\lib\diagram-api-0.2.0-SNAPSHOT.jar;%APP_HOME%\lib\gson-2.8.0.jar;%APP_HOME%\lib\javax.websocket-api-1.0.jar;%APP_HOME%\lib\org.eclipse.emf.common-2.12.0.jar;%APP_HOME%\lib\org.eclipse.xtext-2.13.0-SNAPSHOT.jar;%APP_HOME%\lib\org.eclipse.elk.graph-0.3.0-SNAPSHOT.jar;%APP_HOME%\lib\org.eclipse.emf.ecore.xmi-2.12.0.jar;%APP_HOME%\lib\javax.inject-1.jar;%APP_HOME%\lib\org.eclipse.xtext.util-2.13.0-SNAPSHOT.jar;%APP_HOME%\lib\log4j-1.2.16.jar;%APP_HOME%\lib\org.eclipse.equinox.common-3.8.0.jar;%APP_HOME%\lib\org.eclipse.osgi-3.11.2.jar;%APP_HOME%\lib\guice-3.0.jar;%APP_HOME%\lib\antlr-runtime-3.2.jar;%APP_HOME%\lib\guava-19.0-rc3.jar;%APP_HOME%\lib\org.eclipse.emf.ecore-2.12.0.jar;%APP_HOME%\lib\aopalliance-1.0.jar;%APP_HOME%\lib\org.eclipse.emf.ecore.change-2.11.0.jar;%APP_HOME%\lib\org.eclipse.xtend.lib-2.13.0-SNAPSHOT.jar;%APP_HOME%\lib\org.eclipse.xtext.xbase.lib-2.13.0-SNAPSHOT.jar;%APP_HOME%\lib\org.eclipse.xtend.lib.macro-2.13.0-SNAPSHOT.jar

@rem Execute yang-language-server
"%JAVA_EXE%" %DEFAULT_JVM_OPTS% %JAVA_OPTS% %YANG_LANGUAGE_SERVER_OPTS%  -classpath "%CLASSPATH%" io.typefox.yang.diagram.YangServerLauncher %CMD_LINE_ARGS%

:end
@rem End local scope for the variables with windows NT shell
if "%ERRORLEVEL%"=="0" goto mainEnd

:fail
rem Set variable YANG_LANGUAGE_SERVER_EXIT_CONSOLE if you need the _script_ return code instead of
rem the _cmd.exe /c_ return code!
if  not "" == "%YANG_LANGUAGE_SERVER_EXIT_CONSOLE%" exit 1
exit /b 1

:mainEnd
if "%OS%"=="Windows_NT" endlocal

:omega
