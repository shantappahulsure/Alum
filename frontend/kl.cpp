#include <bits/stdc++.h>
using namespace std;

int main()
{
    int t;
    cin >> t;
    while (t--)
    {
        int n;
        cin >> n;

        map<int, int> mp;
        vector<vector<int>> v(n);  
        for (int i = 0; i < n; i++)
        {
            int ct;
            cin >> ct;
            for (int j = 0; j < ct; j++)
            {
                int x;
                cin >> x;
                v[i].push_back(x);
                mp[x]++;
            }
        }

        bool flag = false;

        for (int i = 0; i < n; i++)
        {
            bool f1 = true;

            for (int j = 0; j < v[i].size(); j++)   
            {
                int x = v[i][j];
                if (mp[x] == 1)
                {
                    f1 = false;
                    break;
                }
            }

            if (f1)
            {
                flag = true;
                break;
            }
        }

        if(flag){
            cout<<"Yes"<<endl;
        }
        else{
            cout<<"No"<<endl;
        }
    }
    return 0;
}