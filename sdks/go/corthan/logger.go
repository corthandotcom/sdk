package corthan

import (
	"log"
	"os"
)

// Logger defines an interface for structured logging inside the SDK.
type Logger interface {
	Debug(msg string, keysAndValues ...interface{})
	Info(msg string, keysAndValues ...interface{})
	Warn(msg string, keysAndValues ...interface{})
	Error(msg string, keysAndValues ...interface{})
}

// NoOpLogger is a logger that discards all log messages.
type NoOpLogger struct{}

func (n *NoOpLogger) Debug(msg string, keysAndValues ...interface{}) {}
func (n *NoOpLogger) Info(msg string, keysAndValues ...interface{})  {}
func (n *NoOpLogger) Warn(msg string, keysAndValues ...interface{})  {}
func (n *NoOpLogger) Error(msg string, keysAndValues ...interface{}) {}

// StdLogger is a basic logger that writes to stdout/stderr.
type StdLogger struct {
	debugLog *log.Logger
	infoLog  *log.Logger
	warnLog  *log.Logger
	errLog   *log.Logger
	verbose  bool
}

// NewStdLogger instantiates a standard stdout/stderr logger.
func NewStdLogger(verbose bool) *StdLogger {
	return &StdLogger{
		debugLog: log.New(os.Stdout, "[corthan-sdk] DEBUG: ", log.LstdFlags),
		infoLog:  log.New(os.Stdout, "[corthan-sdk] INFO: ", log.LstdFlags),
		warnLog:  log.New(os.Stdout, "[corthan-sdk] WARN: ", log.LstdFlags),
		errLog:   log.New(os.Stderr, "[corthan-sdk] ERROR: ", log.LstdFlags),
		verbose:  verbose,
	}
}

func (s *StdLogger) Debug(msg string, keysAndValues ...interface{}) {
	if s.verbose {
		s.debugLog.Println(msg, keysAndValues)
	}
}

func (s *StdLogger) Info(msg string, keysAndValues ...interface{}) {
	s.infoLog.Println(msg, keysAndValues)
}

func (s *StdLogger) Warn(msg string, keysAndValues ...interface{}) {
	s.warnLog.Println(msg, keysAndValues)
}

func (s *StdLogger) Error(msg string, keysAndValues ...interface{}) {
	s.errLog.Println(msg, keysAndValues)
}
