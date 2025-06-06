package solver

import "sync"

// StringTree is a thread-safe tree that stores strings.
type StringTree struct {
	RootNode *TreeNode
	mu       sync.Mutex
	newSeq   chan []string
}

func NewStringTree() *StringTree {
	return &StringTree{RootNode: &TreeNode{}, newSeq: make(chan []string)}
}

func (t *StringTree) PushSequence(seq []string) {
	select {
	case t.newSeq <- seq:
	default:
		t.mu.Lock()
		t.RootNode.PushSequence(seq)
		t.mu.Unlock()
	}
}

func (t *StringTree) PopSequence() []string {
	t.mu.Lock()
	defer t.mu.Unlock()
	return t.RootNode.PopSequence()
}

// PopOrWaitSequence returns a channel that sends a sequence popped from the tree if available.
// Otherwise, it waits for a new sequence to be pushed into the tree and then pops that.
func (t *StringTree) PopOrWaitSequence() <-chan []string {
	if seq := t.PopSequence(); seq != nil {
		ch := make(chan []string, 1)
		ch <- seq
		return ch
	}

	return t.newSeq
}

type TreeNode map[string]*TreeNode

func (n *TreeNode) PushSequence(seq []string) {
	if len(seq) == 0 {
		return
	}

	if _, ok := (*n)[seq[0]]; !ok {
		(*n)[seq[0]] = &TreeNode{}
	}

	(*n)[seq[0]].PushSequence(seq[1:])
}

func (n *TreeNode) PopSequence() []string {
	for child, grandChildren := range *n {
		subSequence := grandChildren.PopSequence()
		if len(*grandChildren) == 0 {
			delete(*n, child)
		}

		return append([]string{child}, subSequence...)
	}

	return nil
}
