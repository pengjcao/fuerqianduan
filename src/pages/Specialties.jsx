import { useContext } from 'react';
import { AppDataContext } from '../context/AppDataContext';

function Specialties() {
  const { specialties } = useContext(AppDataContext);

  return (
    <div>
      <h1 className="page-heading">备案专业名称一览</h1>
      <div className="card">
        {specialties.map((dept) => (
          <div key={dept.id} style={{ marginBottom: 16 }}>
            <div className="section-title">{dept.department}</div>
            <table className="table">
              <thead>
                <tr>
                  <th>科室 / 专业组</th>
                  <th>（树叶一层）备案专业</th>
                  <th>（树叶二层）备案亚专业</th>
                </tr>
              </thead>
              <tbody>
                {dept.groups.map((g) => (
                  <tr key={g.name}>
                    <td>{g.name}</td>
                    <td>{g.primary?.join('、')}</td>
                    <td>{g.secondary?.join('、')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        <p className="small muted">
          * 本页为根据“备案专业名称”表简化的展示，用于支撑后续按专业组管理 PI 备案与临床试验。
        </p>
      </div>
    </div>
  );
}

export default Specialties;


