import os

def check_structure():
    expected_dirs = [
        'src/generation',
        'src/modeling',
        'src/analysis',
        'dataset',
        'models/neural_network/reports',
        'archive',
        'legacy'
    ]
    
    missing = []
    for d in expected_dirs:
        if not os.path.exists(d):
            missing.append(d)
            
    if missing:
        print(f"Missing directories: {missing}")
    else:
        print("Repository structure verification passed.")

if __name__ == "__main__":
    check_structure()
